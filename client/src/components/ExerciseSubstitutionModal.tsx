import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Dumbbell, 
  ArrowRight, 
  Sparkles,
  X
} from 'lucide-react';
import {
  exerciseAlternatives,
  getAlternativesExcluding,
  findMuscleGroupByExerciseName,
  type ExerciseAlternative,
} from '@shared/exercise-alternatives';

interface ExerciseSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExerciseName: string;
  currentMuscleGroup?: string;
  onSubstitute: (newExercise: ExerciseAlternative) => void;
}

export function ExerciseSubstitutionModal({
  isOpen,
  onClose,
  currentExerciseName,
  currentMuscleGroup,
  onSubstitute,
}: ExerciseSubstitutionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Detectar grupo muscular automaticamente se não fornecido
  const detectedMuscleGroup = useMemo(() => {
    if (currentMuscleGroup) return currentMuscleGroup;
    return findMuscleGroupByExerciseName(currentExerciseName) || '';
  }, [currentMuscleGroup, currentExerciseName]);

  // Usar grupo muscular selecionado ou detectado
  const activeMuscleGroup = selectedMuscleGroup || detectedMuscleGroup;

  // Buscar exercícios alternativos
  const alternatives = useMemo(() => {
    if (!activeMuscleGroup) return [];
    return getAlternativesExcluding(activeMuscleGroup, currentExerciseName);
  }, [activeMuscleGroup, currentExerciseName]);

  // Filtrar exercícios
  const filteredAlternatives = useMemo(() => {
    return alternatives.filter((ex) => {
      // Filtro de busca
      if (searchTerm && !ex.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filtro de equipamento
      if (equipmentFilter !== 'all' && ex.equipment !== equipmentFilter) {
        return false;
      }
      // Filtro de dificuldade
      if (difficultyFilter !== 'all' && ex.difficulty !== difficultyFilter) {
        return false;
      }
      return true;
    });
  }, [alternatives, searchTerm, equipmentFilter, difficultyFilter]);

  // Sugestões inteligentes (primeiros 3 exercícios do mesmo grupo)
  const smartSuggestions = useMemo(() => {
    return alternatives.slice(0, 3);
  }, [alternatives]);

  const handleSelect = (exercise: ExerciseAlternative) => {
    onSubstitute(exercise);
    onClose();
    // Reset filters
    setSearchTerm('');
    setEquipmentFilter('all');
    setDifficultyFilter('all');
  };

  const equipmentLabels: Record<string, string> = {
    barra: 'Barra',
    halteres: 'Halteres',
    máquina: 'Máquina',
    cabo: 'Cabo',
    peso_corporal: 'Peso Corporal',
    kettlebell: 'Kettlebell',
    elástico: 'Elástico',
    livre: 'Livre',
  };

  const difficultyLabels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediário: 'Intermediário',
    avançado: 'Avançado',
  };

  const difficultyColors: Record<string, string> = {
    iniciante: 'bg-green-100 text-green-800',
    intermediário: 'bg-yellow-100 text-yellow-800',
    avançado: 'bg-red-100 text-red-800',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header fixo */}
        <div className="p-4 pb-3 border-b bg-background">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Substituir Exercício</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              <span className="text-muted-foreground">Substituindo: </span>
              <span className="font-semibold text-foreground">{currentExerciseName}</span>
              {activeMuscleGroup && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {activeMuscleGroup}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex flex-col max-h-[70vh] overflow-hidden">
          <div className="p-4 space-y-3 flex-shrink-0">
            {/* Sugestões Rápidas */}
            {smartSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  Sugestões Rápidas
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {smartSuggestions.map((exercise) => (
                    <button
                      key={exercise.name}
                      className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent transition-colors text-left"
                      onClick={() => handleSelect(exercise)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{exercise.name}</span>
                        <Badge variant="secondary" className="text-xs w-fit">
                          {equipmentLabels[exercise.equipment]}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            {/* Filtros em linha */}
            <div className="grid grid-cols-3 gap-2">
              <Select value={selectedMuscleGroup || activeMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseAlternatives.map((group) => (
                    <SelectItem key={group.muscleGroup} value={group.muscleGroup}>
                      {group.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Equip." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(equipmentLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(difficultyLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Exercícios com scroll */}
          <div className="flex-1 overflow-hidden border-t">
            <ScrollArea className="h-[200px]">
              <div className="p-2">
                {filteredAlternatives.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum exercício encontrado</p>
                    <p className="text-xs">Tente ajustar os filtros</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAlternatives.map((exercise) => (
                      <button
                        key={exercise.name}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                        onClick={() => handleSelect(exercise)}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{exercise.name}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-xs">
                              {equipmentLabels[exercise.equipment]}
                            </Badge>
                            <Badge className={`text-xs ${difficultyColors[exercise.difficulty]}`}>
                              {difficultyLabels[exercise.difficulty]}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer fixo */}
          <div className="p-3 border-t bg-background flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredAlternatives.length} exercício(s)
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
