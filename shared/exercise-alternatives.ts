// Banco de exercícios alternativos organizados por grupo muscular
// Usado para sugestões de substituição durante o registro de treino

export interface ExerciseAlternative {
  name: string;
  equipment: 'barra' | 'halteres' | 'máquina' | 'cabo' | 'peso_corporal' | 'kettlebell' | 'elástico' | 'livre';
  difficulty: 'iniciante' | 'intermediário' | 'avançado';
  description?: string;
}

export interface MuscleGroupExercises {
  muscleGroup: string;
  displayName: string;
  exercises: ExerciseAlternative[];
}

export const exerciseAlternatives: MuscleGroupExercises[] = [
  {
    muscleGroup: 'Peito',
    displayName: 'Peito',
    exercises: [
      { name: 'Supino Reto com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Supino Reto com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Supino Inclinado com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Supino Inclinado com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Supino Declinado com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Supino Declinado com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Crucifixo com Halteres', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Crucifixo na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Crucifixo no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Crossover Alto', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Crossover Baixo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Chest Press na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Flexão de Braços', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Flexão Inclinada', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Flexão Declinada', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Pullover com Haltere', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Pullover na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Costas',
    displayName: 'Costas',
    exercises: [
      { name: 'Puxada Frontal', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Puxada Aberta', equipment: 'máquina', difficulty: 'intermediário' },
      { name: 'Puxada Fechada', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Puxada Supinada', equipment: 'máquina', difficulty: 'intermediário' },
      { name: 'Pulldown', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Remada Curvada com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Remada Curvada com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Remada Unilateral', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Remada Cavalinho', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Remada Baixa no Cabo', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Remada Alta', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Remada na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Barra Fixa', equipment: 'peso_corporal', difficulty: 'avançado' },
      { name: 'Barra Fixa Supinada', equipment: 'peso_corporal', difficulty: 'avançado' },
      { name: 'Levantamento Terra', equipment: 'barra', difficulty: 'avançado' },
      { name: 'Serrote', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Face Pull', equipment: 'cabo', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Ombro',
    displayName: 'Ombros',
    exercises: [
      { name: 'Desenvolvimento com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Desenvolvimento com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Desenvolvimento Arnold', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Desenvolvimento na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Elevação Lateral', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Elevação Lateral no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Elevação Lateral na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Elevação Frontal', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Elevação Frontal com Barra', equipment: 'barra', difficulty: 'iniciante' },
      { name: 'Elevação Frontal no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Crucifixo Inverso', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Crucifixo Inverso na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Remada Alta', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Face Pull', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Encolhimento com Halteres', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Encolhimento com Barra', equipment: 'barra', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Bíceps',
    displayName: 'Bíceps',
    exercises: [
      { name: 'Rosca Direta com Barra', equipment: 'barra', difficulty: 'iniciante' },
      { name: 'Rosca Direta com Halteres', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Rosca Alternada', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Rosca Martelo', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Rosca Concentrada', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Rosca Scott', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Rosca Scott com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Rosca no Cabo', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Rosca no Cabo Unilateral', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Rosca Inclinada', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Rosca 21', equipment: 'barra', difficulty: 'avançado' },
      { name: 'Rosca Spider', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Rosca com Barra W', equipment: 'barra', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Tríceps',
    displayName: 'Tríceps',
    exercises: [
      { name: 'Tríceps Pulley', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Tríceps Corda', equipment: 'cabo', difficulty: 'iniciante' },
      { name: 'Tríceps Francês', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Tríceps Francês com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Tríceps Testa', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Tríceps Testa com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Tríceps Coice', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Tríceps Banco', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Tríceps na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Mergulho nas Paralelas', equipment: 'peso_corporal', difficulty: 'avançado' },
      { name: 'Supino Fechado', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Extensão de Tríceps Unilateral', equipment: 'cabo', difficulty: 'intermediário' },
    ]
  },
  {
    muscleGroup: 'Quadríceps',
    displayName: 'Quadríceps',
    exercises: [
      { name: 'Agachamento Livre', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Agachamento no Smith', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Agachamento Frontal', equipment: 'barra', difficulty: 'avançado' },
      { name: 'Agachamento Hack', equipment: 'máquina', difficulty: 'intermediário' },
      { name: 'Agachamento Sumô', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Agachamento Goblet', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Leg Press 45°', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Leg Press Horizontal', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Cadeira Extensora', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Avanço com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Avanço com Barra', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Avanço no Smith', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Passada', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Agachamento Búlgaro', equipment: 'halteres', difficulty: 'avançado' },
      { name: 'Step Up', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Sissy Squat', equipment: 'peso_corporal', difficulty: 'avançado' },
    ]
  },
  {
    muscleGroup: 'Posterior',
    displayName: 'Posterior de Coxa',
    exercises: [
      { name: 'Mesa Flexora', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Cadeira Flexora', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Flexora em Pé', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Stiff', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Stiff com Halteres', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Stiff Unilateral', equipment: 'halteres', difficulty: 'avançado' },
      { name: 'Levantamento Terra Romeno', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Good Morning', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Elevação Pélvica', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Nordic Curl', equipment: 'peso_corporal', difficulty: 'avançado' },
    ]
  },
  {
    muscleGroup: 'Glúteos',
    displayName: 'Glúteos',
    exercises: [
      { name: 'Elevação Pélvica', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Elevação Pélvica com Haltere', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Hip Thrust', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Glúteo na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Glúteo no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Abdução de Quadril', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Abdução no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Agachamento Sumô', equipment: 'barra', difficulty: 'intermediário' },
      { name: 'Passada Lateral', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Coice no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Quatro Apoios', equipment: 'peso_corporal', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Panturrilha',
    displayName: 'Panturrilha',
    exercises: [
      { name: 'Panturrilha em Pé', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Panturrilha Sentado', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Panturrilha no Leg Press', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Panturrilha no Smith', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Panturrilha Unilateral', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Panturrilha com Halteres', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Gêmeos no Hack', equipment: 'máquina', difficulty: 'intermediário' },
    ]
  },
  {
    muscleGroup: 'Abdômen',
    displayName: 'Abdômen',
    exercises: [
      { name: 'Abdominal Crunch', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Abdominal Infra', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Abdominal Oblíquo', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Abdominal na Máquina', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Abdominal no Cabo', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Prancha', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Prancha Lateral', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Elevação de Pernas', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Elevação de Pernas na Barra', equipment: 'peso_corporal', difficulty: 'avançado' },
      { name: 'Bicicleta', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Mountain Climber', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Russian Twist', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Ab Wheel', equipment: 'livre', difficulty: 'avançado' },
    ]
  },
  {
    muscleGroup: 'Core',
    displayName: 'Core',
    exercises: [
      { name: 'Prancha', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Prancha Lateral', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Prancha com Elevação de Braço', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Dead Bug', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Bird Dog', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Pallof Press', equipment: 'cabo', difficulty: 'intermediário' },
      { name: 'Hollow Hold', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'Stir the Pot', equipment: 'livre', difficulty: 'avançado' },
    ]
  },
  {
    muscleGroup: 'Antebraço',
    displayName: 'Antebraço',
    exercises: [
      { name: 'Rosca de Punho', equipment: 'barra', difficulty: 'iniciante' },
      { name: 'Rosca de Punho Invertida', equipment: 'barra', difficulty: 'iniciante' },
      { name: 'Rosca de Punho com Halteres', equipment: 'halteres', difficulty: 'iniciante' },
      { name: 'Farmer Walk', equipment: 'halteres', difficulty: 'intermediário' },
      { name: 'Hand Gripper', equipment: 'livre', difficulty: 'iniciante' },
    ]
  },
  {
    muscleGroup: 'Cardio',
    displayName: 'Cardio',
    exercises: [
      { name: 'Esteira', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Bicicleta Ergométrica', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Elíptico', equipment: 'máquina', difficulty: 'iniciante' },
      { name: 'Remo', equipment: 'máquina', difficulty: 'intermediário' },
      { name: 'Escada', equipment: 'máquina', difficulty: 'intermediário' },
      { name: 'Pular Corda', equipment: 'livre', difficulty: 'intermediário' },
      { name: 'Burpee', equipment: 'peso_corporal', difficulty: 'avançado' },
      { name: 'Jumping Jack', equipment: 'peso_corporal', difficulty: 'iniciante' },
      { name: 'Mountain Climber', equipment: 'peso_corporal', difficulty: 'intermediário' },
      { name: 'HIIT', equipment: 'livre', difficulty: 'avançado' },
    ]
  },
];

// Função para buscar exercícios alternativos por grupo muscular
export function getAlternativesByMuscleGroup(muscleGroup: string): ExerciseAlternative[] {
  const group = exerciseAlternatives.find(
    g => g.muscleGroup.toLowerCase() === muscleGroup.toLowerCase() ||
         g.displayName.toLowerCase() === muscleGroup.toLowerCase()
  );
  return group?.exercises || [];
}

// Função para buscar exercícios alternativos excluindo o exercício atual
export function getAlternativesExcluding(muscleGroup: string, currentExerciseName: string): ExerciseAlternative[] {
  const alternatives = getAlternativesByMuscleGroup(muscleGroup);
  return alternatives.filter(ex => ex.name.toLowerCase() !== currentExerciseName.toLowerCase());
}

// Função para buscar todos os grupos musculares
export function getAllMuscleGroups(): string[] {
  return exerciseAlternatives.map(g => g.muscleGroup);
}

// Função para identificar o grupo muscular de um exercício pelo nome
export function findMuscleGroupByExerciseName(exerciseName: string): string | null {
  for (const group of exerciseAlternatives) {
    const found = group.exercises.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (found) {
      return group.muscleGroup;
    }
  }
  return null;
}

// Função para buscar exercícios similares (mesmo equipamento ou dificuldade)
export function getSimilarExercises(
  muscleGroup: string, 
  currentExerciseName: string,
  preferredEquipment?: string
): ExerciseAlternative[] {
  const alternatives = getAlternativesExcluding(muscleGroup, currentExerciseName);
  
  if (preferredEquipment) {
    // Prioriza exercícios com o mesmo equipamento
    const sameEquipment = alternatives.filter(ex => ex.equipment === preferredEquipment);
    const otherEquipment = alternatives.filter(ex => ex.equipment !== preferredEquipment);
    return [...sameEquipment, ...otherEquipment];
  }
  
  return alternatives;
}
