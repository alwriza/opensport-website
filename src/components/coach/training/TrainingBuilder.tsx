import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, X } from "lucide-react";
import type { Exercise } from "@/types/coach";

interface BuilderExercise {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
}

interface TrainingBuilderProps {
  exercises: BuilderExercise[];
  onAdd: (exercise: BuilderExercise) => void;
  onRemove: (id: string) => void;
  onReorder: (exercises: BuilderExercise[]) => void;
  onUpdateDuration: (id: string, minutes: number) => void;
  library: Exercise[];
}

function SortableBlock({
  exercise,
  onRemove,
  onUpdateDuration,
}: {
  exercise: BuilderExercise;
  onRemove: (id: string) => void;
  onUpdateDuration: (id: string, minutes: number) => void;
}) {
  const { t } = useTranslation("dashboard");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-sm border ${
        isDragging ? "border-primary bg-primary/10" : "border-border bg-secondary/35"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{exercise.name}</span>
        <Badge variant="outline" className="ml-2 border-border text-[9px]">
          {exercise.category}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={120}
          value={exercise.duration_minutes}
          onChange={(e) => onUpdateDuration(exercise.id, parseInt(e.target.value) || 10)}
          className="w-14 h-7 text-center text-xs bg-background/50 border border-border rounded text-muted-foreground"
        />
        <span className="text-[10px] text-muted-foreground">{t("coach.training.min")}</span>
      </div>
      <button
        onClick={() => onRemove(exercise.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TrainingBuilder({
  exercises,
  onAdd,
  onRemove,
  onReorder,
  onUpdateDuration,
  library,
}: TrainingBuilderProps) {
  const { t } = useTranslation("dashboard");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = exercises.findIndex((e) => e.id === active.id);
        const newIndex = exercises.findIndex((e) => e.id === over.id);
        onReorder(arrayMove(exercises, oldIndex, newIndex));
      }
    },
    [exercises, onReorder]
  );

  const handleAddExercise = (ex: Exercise) => {
    onAdd({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      duration_minutes: ex.duration_minutes ?? 10,
    });
    setShowAddDialog(false);
  };

  const categories = ["all", ...new Set(library.map((e) => e.category))];
  const filteredLibrary =
    selectedCategory === "all"
      ? library
      : library.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {t("coach.training.exercises")} ({exercises.length})
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-xs gap-1"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-3 w-3" /> {t("coach.training.addExercise")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={exercises.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px] rounded-sm border-2 border-dashed border-border p-4">
            {exercises.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">
                {t("coach.training.dragExercises")}
              </p>
            ) : (
              exercises.map((ex) => (
                <SortableBlock
                  key={ex.id}
                  exercise={ex}
                  onRemove={onRemove}
                  onUpdateDuration={onUpdateDuration}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Exercise Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-sm p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {t("coach.training.addExercise")}
              </h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-none text-[10px] font-medium border transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/35 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredLibrary.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="w-full flex items-center gap-3 p-3 rounded-sm bg-secondary/35 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{ex.name}</span>
                    <Badge variant="outline" className="ml-2 border-border text-[9px]">
                      {ex.difficulty}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {ex.duration_minutes}min
                  </span>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              ))}
              {filteredLibrary.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t("coach.training.noExercises")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}