'use client'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { VideoCard } from '../VideoCard'
import type { POIVideo } from '@/lib/hooks/usePOIManagement'

interface SortableVideoCardProps {
  video: POIVideo
  poiName: string
  poiDescription?: string | null
  onEdit: (videoId: string) => void
  onDelete: (videoId: string) => void
}

function SortableVideoCard({ video, poiName, poiDescription, onEdit, onDelete }: SortableVideoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      <VideoCard
        video={video}
        poiName={poiName}
        poiDescription={poiDescription}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

interface SortableVideoListProps {
  videos: POIVideo[]
  poiName: string
  poiDescription?: string | null
  onEdit: (videoId: string) => void
  onDelete: (videoId: string) => void
  onReorder: (updates: Array<{ id: string; displayOrder: number }>) => Promise<void>
}

export function SortableVideoList({
  videos,
  poiName,
  poiDescription,
  onEdit,
  onDelete,
  onReorder
}: SortableVideoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = videos.findIndex(v => v.id === active.id)
    const newIndex = videos.findIndex(v => v.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder locally for instant feedback
    const newVideos = arrayMove(videos, oldIndex, newIndex)

    // Create updates with new display orders
    const updates = newVideos.map((video, index) => ({
      id: video.id,
      displayOrder: index
    }))

    // Send to server
    await onReorder(updates)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={videos.map(v => v.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {videos.map(video => (
            <SortableVideoCard
              key={video.id}
              video={video}
              poiName={poiName}
              poiDescription={poiDescription}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
