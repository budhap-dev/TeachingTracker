import type { ReactNode } from 'react'
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

/**
 * The site editor's one drag-to-reorder treatment (REQ-008): rows and whole
 * sections sort with the same grip, ghost and glide. Pointer and keyboard
 * sensors both work — focus a grip, Space lifts, arrows move, Space drops —
 * so reordering is never mouse-only.
 */

/** Applies a drag result to an id list; exported for direct testing. */
export const reorderIds = (
    ids: string[],
    activeId: string,
    overId: string | null
): string[] => {
    if (!overId || activeId === overId) {
        return ids
    }
    return arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId))
}

type SortableItemProps = {
    id: string
    children: ReactNode
    /** Accessible name for the drag grip. */
    label: string
}

/** One draggable row: a grip beside the row's own content. */
export const SortableItem = ({ id, children, label }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    return (
        <div
            ref={setNodeRef}
            className={`sortable-item ${isDragging ? 'dragging' : ''}`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <button
                type="button"
                className="sortable-grip"
                aria-label={label}
                {...attributes}
                {...listeners}
            >
                <DragIndicatorIcon fontSize="small" />
            </button>
            {children}
        </div>
    )
}

type SortableListProps = {
    ids: string[]
    onReorder: (ids: string[]) => void
    children: ReactNode
}

/** The context wrapping a set of SortableItems, vertical-list strategy. */
export const SortableList = ({
    ids,
    onReorder,
    children,
}: SortableListProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const next = reorderIds(
            ids,
            String(event.active.id),
            event.over ? String(event.over.id) : null
        )
        if (next !== ids) {
            onReorder(next)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    )
}
