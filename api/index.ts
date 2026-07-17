import 'dotenv/config';
import express, { Express, Request } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Self-contained on purpose: Vercel's Node function builder for this project
// does not reliably bundle relative imports that live outside /api (same
// issue documented in the sibling Stegion-LOW project). Keeping everything
// in this one file avoids that entirely. server.ts (local dev / traditional
// Node hosting) still uses the shared app.ts factory — only this Vercel
// entrypoint duplicates the route definitions. Keep in sync with ../app.ts.

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

function createApp(): Express {
  const app = express();
  app.use(express.json());

  const supabaseForRequest = (req: Request): SupabaseClient | null => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
  };

  const requireClient = (req: Request, res: express.Response): SupabaseClient | null => {
    const client = supabaseForRequest(req);
    if (!client) {
      res.status(401).json({ success: false, error: 'Não autenticado' });
      return null;
    }
    return client;
  };

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------

  app.get('/api/supabase/status', async (req, res) => {
    if (!supabase) {
      return res.json({ success: false, message: 'Supabase não está configurado no servidor (defina SUPABASE_URL e SUPABASE_ANON_KEY).' });
    }
    try {
      const { error } = await supabase.from('institutions').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.message.includes('relation "institutions" does not exist')) {
          return res.json({ success: true, message: 'Conectado ao Supabase! Atenção: as tabelas ainda não foram criadas (rode supabase/schema.sql).' });
        }
        return res.json({ success: false, message: `Erro ao consultar o banco: ${error.message}` });
      }
      return res.json({ success: true, message: 'Conectado e sincronizado com o Supabase com sucesso!' });
    } catch (e: any) {
      return res.json({ success: false, message: e.message || 'Erro de rede ou conexão inválida.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    if (!supabase) return res.status(503).json({ success: false, error: 'Supabase não configurado no servidor' });
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return res.status(401).json({ success: false, error: error?.message || 'Credenciais inválidas' });
    }
    res.json({ success: true, accessToken: data.session.access_token, user: { id: data.user?.id, email: data.user?.email } });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!supabase) return res.status(503).json({ success: false, error: 'Supabase não configurado no servidor' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'Não autenticado' });
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
    res.json({ success: true, user: { id: data.user.id, email: data.user.email } });
  });

  // ---------------------------------------------------------------------
  // Institutions (Carteira de Clientes)
  // ---------------------------------------------------------------------

  app.get('/api/institutions', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    let query = client
      .from('institutions')
      .select('*, institution_contacts(count), demands(count), deals(count)')
      .order('name', { ascending: true });
    const { search, segment } = req.query;
    if (typeof search === 'string' && search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    if (typeof segment === 'string' && segment.trim()) query = query.eq('segment', segment.trim());
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, institutions: data || [] });
  });

  app.get('/api/institutions/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client
      .from('institutions')
      .select('*, institution_contacts(*)')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    res.json({ success: true, institution: data });
  });

  app.post('/api/institutions', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { name, segment, notes } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'name é obrigatório' });
    const { data, error } = await client.from('institutions').insert({ name, segment: segment || null, notes: notes || '' }).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, institution: data });
  });

  app.put('/api/institutions/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { name, segment, notes } = req.body || {};
    const { data, error } = await client
      .from('institutions')
      .update({ name, segment: segment || null, notes: notes || '' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, institution: data });
  });

  app.delete('/api/institutions/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('institutions').delete().eq('id', req.params.id);
    if (error) {
      if (error.code === '23503') {
        return res.status(409).json({ success: false, error: 'Não é possível excluir: esta instituição tem demandas ou negociações vinculadas.' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  app.get('/api/institutions/:id/contacts', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client
      .from('institution_contacts')
      .select('*')
      .eq('institution_id', req.params.id)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, contacts: data || [] });
  });

  app.post('/api/institutions/:id/contacts', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { name, roleTitle, email, phone, isPrimary, notes } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'name é obrigatório' });
    const { data, error } = await client
      .from('institution_contacts')
      .insert({
        institution_id: req.params.id,
        name,
        role_title: roleTitle || '',
        email: email || '',
        phone: phone || '',
        is_primary: !!isPrimary,
        notes: notes || ''
      })
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, contact: data });
  });

  app.put('/api/institutions/:id/contacts/:contactId', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { name, roleTitle, email, phone, isPrimary, notes } = req.body || {};
    const { data, error } = await client
      .from('institution_contacts')
      .update({ name, role_title: roleTitle || '', email: email || '', phone: phone || '', is_primary: !!isPrimary, notes: notes || '' })
      .eq('id', req.params.contactId)
      .eq('institution_id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, contact: data });
  });

  app.delete('/api/institutions/:id/contacts/:contactId', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('institution_contacts').delete().eq('id', req.params.contactId).eq('institution_id', req.params.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------
  // Demands
  // ---------------------------------------------------------------------

  app.get('/api/demands', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    let query = client
      .from('demands')
      .select('*, institutions(name)')
      .order('created_at', { ascending: false });
    const { institution_id, status, asset_type } = req.query;
    if (typeof institution_id === 'string' && institution_id) query = query.eq('institution_id', institution_id);
    if (typeof status === 'string' && status) query = query.eq('status', status);
    if (typeof asset_type === 'string' && asset_type) query = query.eq('asset_type', asset_type);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, demands: data || [] });
  });

  app.get('/api/demands/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client.from('demands').select('*, institutions(name)').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    res.json({ success: true, demand: data });
  });

  app.post('/api/demands', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { institutionId, assetType, budgetMin, budgetMax, region, status, notes } = req.body || {};
    if (!institutionId || !assetType) return res.status(400).json({ success: false, error: 'institutionId e assetType são obrigatórios' });
    const { data, error } = await client
      .from('demands')
      .insert({
        institution_id: institutionId,
        asset_type: assetType,
        budget_min: budgetMin ?? null,
        budget_max: budgetMax ?? null,
        region: region || '',
        status: status || 'aberta',
        notes: notes || ''
      })
      .select('*, institutions(name)')
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, demand: data });
  });

  app.put('/api/demands/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { institutionId, assetType, budgetMin, budgetMax, region, status, notes } = req.body || {};
    const { data, error } = await client
      .from('demands')
      .update({
        institution_id: institutionId,
        asset_type: assetType,
        budget_min: budgetMin ?? null,
        budget_max: budgetMax ?? null,
        region: region || '',
        status,
        notes: notes || ''
      })
      .eq('id', req.params.id)
      .select('*, institutions(name)')
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, demand: data });
  });

  app.delete('/api/demands/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('demands').delete().eq('id', req.params.id);
    if (error) {
      if (error.code === '23503') {
        return res.status(409).json({ success: false, error: 'Não é possível excluir: esta demanda tem negociações vinculadas.' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------
  // Assets (Cadastro de Ativos)
  // ---------------------------------------------------------------------

  app.get('/api/assets', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    let query = client.from('assets').select('*').order('created_at', { ascending: false });
    const { type, status, search } = req.query;
    if (typeof type === 'string' && type) query = query.eq('type', type);
    if (typeof status === 'string' && status) query = query.eq('status', status);
    if (typeof search === 'string' && search.trim()) query = query.ilike('address', `%${search.trim()}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, assets: data || [] });
  });

  app.get('/api/assets/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client.from('assets').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    res.json({ success: true, asset: data });
  });

  app.post('/api/assets', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { type, address, areaM2, price, capRate, ownerName, driveLink, status, notes } = req.body || {};
    if (!type || !address) return res.status(400).json({ success: false, error: 'type e address são obrigatórios' });
    const { data, error } = await client
      .from('assets')
      .insert({
        type,
        address,
        area_m2: areaM2 ?? null,
        price: price ?? null,
        cap_rate: capRate ?? null,
        owner_name: ownerName || '',
        drive_link: driveLink || '',
        status: status || 'disponivel',
        notes: notes || ''
      })
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, asset: data });
  });

  app.put('/api/assets/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { type, address, areaM2, price, capRate, ownerName, driveLink, status, notes } = req.body || {};
    const { data, error } = await client
      .from('assets')
      .update({
        type,
        address,
        area_m2: areaM2 ?? null,
        price: price ?? null,
        cap_rate: capRate ?? null,
        owner_name: ownerName || '',
        drive_link: driveLink || '',
        status,
        notes: notes || ''
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, asset: data });
  });

  app.delete('/api/assets/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('assets').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------
  // Pipeline stages
  // ---------------------------------------------------------------------

  app.get('/api/pipeline-stages', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client.from('pipeline_stages').select('*').order('sort_order', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, stages: data || [] });
  });

  // ---------------------------------------------------------------------
  // Deals (Pipeline de Negociação)
  // ---------------------------------------------------------------------

  const DEAL_LIST_SELECT = '*, institutions(name), demands(asset_type,budget_min,budget_max), institution_contacts(name), deal_assets(asset_id)';
  const DEAL_DETAIL_SELECT = '*, institutions(name), demands(asset_type,budget_min,budget_max), institution_contacts(name), deal_assets(asset_id, assets(*)), deal_calendar_events(*)';

  app.get('/api/deals', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client
      .from('deals')
      .select(DEAL_LIST_SELECT)
      .order('stage_key', { ascending: true })
      .order('board_position', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, deals: data || [] });
  });

  app.get('/api/deals/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client.from('deals').select(DEAL_DETAIL_SELECT).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    res.json({ success: true, deal: data });
  });

  app.post('/api/deals', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { institutionId, demandId, contactId, stageKey, value, probability, expectedCloseDate, driveLink, notes } = req.body || {};
    if (!institutionId || !demandId) return res.status(400).json({ success: false, error: 'institutionId e demandId são obrigatórios' });

    const { count } = await client.from('deals').select('id', { count: 'exact', head: true }).eq('stage_key', stageKey || 'prospeccao');

    const { data, error } = await client
      .from('deals')
      .insert({
        institution_id: institutionId,
        demand_id: demandId,
        contact_id: contactId || null,
        stage_key: stageKey || 'prospeccao',
        board_position: count || 0,
        value: value ?? 0,
        probability: probability ?? 50,
        expected_close_date: expectedCloseDate || null,
        drive_link: driveLink || '',
        notes: notes || ''
      })
      .select(DEAL_LIST_SELECT)
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, deal: data });
  });

  app.put('/api/deals/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { institutionId, demandId, contactId, value, probability, expectedCloseDate, driveLink, notes } = req.body || {};
    const { data, error } = await client
      .from('deals')
      .update({
        institution_id: institutionId,
        demand_id: demandId,
        contact_id: contactId || null,
        value: value ?? 0,
        probability: probability ?? 50,
        expected_close_date: expectedCloseDate || null,
        drive_link: driveLink || '',
        notes: notes || ''
      })
      .eq('id', req.params.id)
      .select(DEAL_LIST_SELECT)
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, deal: data });
  });

  app.patch('/api/deals/reorder', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { stageKey, orderedDealIds } = req.body || {};
    if (!stageKey || !Array.isArray(orderedDealIds)) {
      return res.status(400).json({ success: false, error: 'stageKey e orderedDealIds[] são obrigatórios' });
    }
    for (let i = 0; i < orderedDealIds.length; i++) {
      const { error } = await client
        .from('deals')
        .update({ stage_key: stageKey, board_position: i })
        .eq('id', orderedDealIds[i]);
      if (error) return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  app.delete('/api/deals/:id', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('deals').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.post('/api/deals/:id/assets', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { assetId } = req.body || {};
    if (!assetId) return res.status(400).json({ success: false, error: 'assetId é obrigatório' });
    const { error } = await client.from('deal_assets').insert({ deal_id: req.params.id, asset_id: assetId });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/deals/:id/assets/:assetId', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('deal_assets').delete().eq('deal_id', req.params.id).eq('asset_id', req.params.assetId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.get('/api/deals/:id/calendar-events', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client
      .from('deal_calendar_events')
      .select('*')
      .eq('deal_id', req.params.id)
      .order('start_snapshot', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, events: data || [] });
  });

  app.post('/api/deals/:id/calendar-events', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { googleEventId, titleSnapshot, startSnapshot, htmlLink, hangoutLink } = req.body || {};
    if (!googleEventId) return res.status(400).json({ success: false, error: 'googleEventId é obrigatório' });
    const { data, error } = await client
      .from('deal_calendar_events')
      .upsert(
        {
          deal_id: req.params.id,
          google_event_id: googleEventId,
          title_snapshot: titleSnapshot || '',
          start_snapshot: startSnapshot || null,
          html_link: htmlLink || '',
          hangout_link: hangoutLink || ''
        },
        { onConflict: 'deal_id,google_event_id' }
      )
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, event: data });
  });

  app.delete('/api/deals/:id/calendar-events/:refId', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { error } = await client.from('deal_calendar_events').delete().eq('id', req.params.refId).eq('deal_id', req.params.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.get('/api/calendar-events/upcoming', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;
    const { data, error } = await client
      .from('deal_calendar_events')
      .select('*, deals(id, institutions(name), demands(asset_type))')
      .gte('start_snapshot', new Date().toISOString())
      .order('start_snapshot', { ascending: true })
      .limit(20);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, events: data || [] });
  });

  // ---------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------

  app.get('/api/dashboard/kpis', async (req, res) => {
    const client = requireClient(req, res);
    if (!client) return;

    const [stagesRes, dealsRes, demandsRes, assetsRes] = await Promise.all([
      client.from('pipeline_stages').select('*'),
      client.from('deals').select('id, stage_key, value, probability'),
      client.from('demands').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
      client.from('assets').select('id', { count: 'exact', head: true })
    ]);

    if (stagesRes.error) return res.status(500).json({ success: false, error: stagesRes.error.message });
    if (dealsRes.error) return res.status(500).json({ success: false, error: dealsRes.error.message });

    const stages = stagesRes.data || [];
    const deals = dealsRes.data || [];
    const closedKeys = new Set(stages.filter((s) => s.is_closed_won || s.is_closed_lost).map((s) => s.key));
    const wonKeys = new Set(stages.filter((s) => s.is_closed_won).map((s) => s.key));

    const openDeals = deals.filter((d) => !closedKeys.has(d.stage_key));
    const wonDeals = deals.filter((d) => wonKeys.has(d.stage_key));
    const closedDeals = deals.filter((d) => closedKeys.has(d.stage_key));

    const openPipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const weightedPipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.value || 0) * Number(d.probability || 0)) / 100, 0);
    const averageTicket = wonDeals.length ? wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0) / wonDeals.length : 0;

    const dealsByStage = stages
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => {
        const inStage = deals.filter((d) => d.stage_key === s.key);
        return { stageKey: s.key, count: inStage.length, value: inStage.reduce((sum, d) => sum + Number(d.value || 0), 0) };
      });

    res.json({
      success: true,
      kpis: {
        openPipelineValue,
        weightedPipelineValue,
        activeDemands: demandsRes.count || 0,
        registeredAssets: assetsRes.count || 0,
        dealsWon: wonDeals.length,
        dealsClosed: closedDeals.length,
        averageTicket,
        dealsByStage
      }
    });
  });

  return app;
}

export default createApp();
