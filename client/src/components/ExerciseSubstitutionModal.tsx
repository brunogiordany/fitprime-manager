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
  Check,
  Filter,
  Sparkles
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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Substituir Exercício
          </DialogTitle>
          <DialogDescription>
            Substituindo: <span className="font-semibold text-foreground">{currentExerciseName}</span>
            {activeMuscleGroup && (
              <Badge variant="outline" className="ml-2">
                {activeMuscleGroup}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sugestões Inteligentes */}
          {smartSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Sugestões Rápidas
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {smartSuggestions.map((exercise) => (
                  <Button
                    key={exercise.name}
                    variant="outline"
                    className="justify-start h-auto py-2 px-3 text-left"
                    onClick={() => handleSelect(exercise)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <span className="text-sm font-medium truncate w-full">
                        {exercise.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {equipmentLabels[exercise.equipment]}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedMuscleGroup || activeMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Grupo Muscular" />
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
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Equipamento" />
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
              <SelectTrigger className="w-full sm:w-[140px]">
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

          {/* Lista de Exercícios */}
          <ScrollArea className="h-[300px] rounded-md border p-2">
            {filteredAlternatives.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum exercício encontrado</p>
                <p className="text-xs">Tente ajustar os filtros</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAlternatives.map((exercise) => (
                  <button
                    key={exercise.name}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    onClick={() => handleSelect(exercise)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{exercise.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {equipmentLabels[exercise.equipment]}
                        </Badge>
                        <Badge className={`text-xs ${difficultyColors[exercise.difficulty]}`}>
                          {difficultyLabels[exercise.difficulty]}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Contador */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredAlternatives.length} exercício(s) disponível(is)
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
