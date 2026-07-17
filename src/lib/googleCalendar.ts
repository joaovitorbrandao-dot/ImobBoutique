// Thin wrapper around the Google Calendar REST API, called directly from the
// browser with the OAuth access token obtained via firebaseAuth.ts. No
// server round trip needed — same approach the sibling Stegion-LOW app uses.

export interface GCalEventInput {
  title: string;
  description?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  addMeet?: boolean;
}

export interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
}

const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const buildBody = (input: GCalEventInput) => {
  const body: any = {
    summary: input.title,
    location: input.location || undefined,
    description: input.description || undefined,
    start: { dateTime: `${input.date}T${input.startTime}:00`, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: `${input.date}T${input.endTime}:00`, timeZone: 'America/Sao_Paulo' },
  };
  if (input.addMeet) {
    body.conferenceData = {
      createRequest: { requestId: `meet-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } },
    };
  }
  return body;
};

export const createCalendarEvent = async (accessToken: string, input: GCalEventInput): Promise<GCalEvent> => {
  const url = `${EVENTS_URL}${input.addMeet ? '?conferenceDataVersion=1' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(input)),
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || 'Erro ao criar evento no Google Agenda');
  return data;
};

export const updateCalendarEvent = async (accessToken: string, eventId: string, input: GCalEventInput): Promise<GCalEvent> => {
  const url = `${EVENTS_URL}/${eventId}${input.addMeet ? '?conferenceDataVersion=1' : ''}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(input)),
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || 'Erro ao atualizar evento no Google Agenda');
  return data;
};

export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<void> => {
  const res = await fetch(`${EVENTS_URL}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204 && res.status !== 410) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || 'Erro ao excluir evento no Google Agenda');
  }
};
