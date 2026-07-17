import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Deal, PipelineStage } from '../../types';
import DealColumn from './DealColumn';
import DealCard from './DealCard';

interface BoardViewProps {
  stages: PipelineStage[];
  deals: Deal[];
  onOpenDeal: (deal: Deal) => void;
  onPersistReorder: (stageKey: string, orderedDealIds: string[], movedDealId: string) => void;
}

type ItemsByStage = Record<string, string[]>;

const buildItemsByStage = (stages: PipelineStage[], deals: Deal[]): ItemsByStage => {
  const grouped: ItemsByStage = {};
  stages.forEach((s) => (grouped[s.key] = []));
  deals
    .slice()
    .sort((a, b) => a.boardPosition - b.boardPosition)
    .forEach((d) => {
      if (!grouped[d.stageKey]) grouped[d.stageKey] = [];
      grouped[d.stageKey].push(d.id);
    });
  return grouped;
};

const findContainer = (itemsByStage: ItemsByStage, id: string): string | undefined => {
  if (id in itemsByStage) return id;
  return Object.keys(itemsByStage).find((key) => itemsByStage[key].includes(id));
};

export default function BoardView({ stages, deals, onOpenDeal, onPersistReorder }: BoardViewProps) {
  const [itemsByStage, setItemsByStage] = useState<ItemsByStage>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const dealsById: Record<string, Deal> = Object.fromEntries(deals.map((d) => [d.id, d]));

  useEffect(() => {
    setItemsByStage(buildItemsByStage(stages, deals));
  }, [stages, deals]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeContainer = findContainer(itemsByStage, activeId);
    const overContainer = findContainer(itemsByStage, overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItemsByStage((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = overItems.indexOf(overId);
      const newIndex = overId in prev ? overItems.length : overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeId),
        [overContainer]: [...overItems.slice(0, newIndex), activeId, ...overItems.slice(newIndex)],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeContainer = findContainer(itemsByStage, activeId);
    const overContainer = findContainer(itemsByStage, overId);
    if (!activeContainer || !overContainer) return;

    let finalItems = itemsByStage[overContainer];
    if (activeContainer === overContainer) {
      const activeIndex = finalItems.indexOf(activeId);
      const overIndex = finalItems.indexOf(overId);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        finalItems = arrayMove(finalItems, activeIndex, overIndex);
        setItemsByStage((prev) => ({ ...prev, [overContainer]: finalItems }));
      }
    }
    onPersistReorder(overContainer, finalItems, activeId);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 items-start overflow-x-auto pb-4" id="kanban-view">
        {stages.map((stage) => {
          const dealIds = itemsByStage[stage.key] || [];
          const totalValue = dealIds.reduce((sum, id) => sum + (dealsById[id]?.value || 0), 0);
          return (
            <DealColumn
              key={stage.key}
              stage={stage}
              dealIds={dealIds}
              dealsById={dealsById}
              totalValue={totalValue}
              onOpenDeal={onOpenDeal}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId && dealsById[activeId] ? <DealCard deal={dealsById[activeId]} onClick={() => {}} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
