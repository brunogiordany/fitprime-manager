import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface SortableBlockItemProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function SortableBlockItem({
  id,
  children,
  isSelected,
  onClick,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? "border-emerald-500 bg-emerald-50" 
          : "hover:border-gray-300"
      } ${isDragging ? "shadow-lg" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {children}
        <div className="flex items-center gap-1 ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SortableBlockItem;
