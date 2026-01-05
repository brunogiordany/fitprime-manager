// Templates de treinos pré-programados por objetivo
// Estes templates servem como base para geração de treinos

export type WorkoutGoal = 
  | 'hypertrophy' 
  | 'weight_loss' 
  | 'recomposition' 
  | 'conditioning' 
  | 'strength' 
  | 'bulking' 
  | 'cutting' 
  | 'general';

export type ExperienceLevel = 'none' | 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseTemplate {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDayTemplate {
  name: string;
  dayOfWeek?: string;
  exercises: ExerciseTemplate[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal;
  difficulty: ExperienceLevel;
  daysPerWeek: number;
  type: 'strength' | 'cardio' | 'flexibility' | 'functional' | 'mixed';
  days: WorkoutDayTemplate[];
}

// ==================== TEMPLATES DE HIPERTROFIA ====================

export const hypertrophyBeginnerABC: WorkoutTemplate = {
  id: 'hypertrophy-beginner-abc',
  name: 'Hipertrofia Iniciante - ABC',
  description: 'Treino de hipertrofia para iniciantes com divisão ABC. Foco em movimentos compostos e técnica.',
  goal: 'hypertrophy',
  difficulty: 'beginner',
  daysPerWeek: 3,
  type: 'strength',
  days: [
    {
      name: 'Treino A - Peito, Ombro e Tríceps',
      exercises: [
        { name: 'Supino Reto com Barra', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Crucifixo na Máquina', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombro', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombro', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps Francês', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 60 },
      ]
    },
    {
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Pulldown', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Rosca Direta com Barra', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Alternada', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 60 },
      ]
    },
    {
      name: 'Treino C - Pernas e Abdômen',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 120 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '12-15', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '30-45s', restSeconds: 45 },
      ]
    }
  ]
};

export const hypertrophyIntermediateABCD: WorkoutTemplate = {
  id: 'hypertrophy-intermediate-abcd',
  name: 'Hipertrofia Intermediário - ABCD',
  description: 'Treino de hipertrofia para intermediários com divisão ABCD. Maior volume e intensidade.',
  goal: 'hypertrophy',
  difficulty: 'intermediate',
  daysPerWeek: 4,
  type: 'strength',
  days: [
    {
      name: 'Treino A - Peito e Tríceps',
      exercises: [
        { name: 'Supino Reto com Barra', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Crossover', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Crucifixo Inclinado', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps Pulley Corda', muscleGroup: 'Tríceps', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps Testa', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Mergulho no Banco', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 60 },
      ]
    },
    {
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Barra Fixa', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 120, notes: 'Use assistência se necessário' },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Puxada Frontal Pegada Fechada', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Cavalinho', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Direta com Barra W', muscleGroup: 'Bíceps', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Scott', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Concentrada', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino C - Ombros e Trapézio',
      exercises: [
        { name: 'Desenvolvimento Militar', muscleGroup: 'Ombro', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombro', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Elevação Frontal Alternada', muscleGroup: 'Ombro', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Crucifixo Invertido', muscleGroup: 'Ombro Posterior', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Encolhimento com Barra', muscleGroup: 'Trapézio', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Face Pull', muscleGroup: 'Ombro Posterior', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino D - Pernas Completo',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 5, reps: '6-8', restSeconds: 180 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Hack Squat', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '12-15', restSeconds: 45 },
      ]
    }
  ]
};

// ==================== TEMPLATES DE EMAGRECIMENTO ====================

export const weightLossCircuit: WorkoutTemplate = {
  id: 'weight-loss-circuit',
  name: 'Emagrecimento - Circuito Metabólico',
  description: 'Treino em circuito para maximizar gasto calórico. Combina exercícios de força e cardio.',
  goal: 'weight_loss',
  difficulty: 'beginner',
  daysPerWeek: 3,
  type: 'mixed',
  days: [
    {
      name: 'Circuito Full Body A',
      exercises: [
        { name: 'Agachamento com Peso Corporal', muscleGroup: 'Pernas', sets: 3, reps: '15-20', restSeconds: 30 },
        { name: 'Flexão de Braços', muscleGroup: 'Peito', sets: 3, reps: '10-15', restSeconds: 30, notes: 'Pode fazer no joelho' },
        { name: 'Remada com Halteres', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 30 },
        { name: 'Afundo Alternado', muscleGroup: 'Pernas', sets: 3, reps: '12 cada', restSeconds: 30 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '30-45s', restSeconds: 30 },
        { name: 'Jumping Jacks', muscleGroup: 'Cardio', sets: 3, reps: '30s', restSeconds: 30 },
        { name: 'Mountain Climbers', muscleGroup: 'Cardio/Core', sets: 3, reps: '30s', restSeconds: 60, notes: 'Descanse 2min e repita o circuito' },
      ]
    },
    {
      name: 'Circuito Full Body B',
      exercises: [
        { name: 'Sumo Squat', muscleGroup: 'Pernas', sets: 3, reps: '15-20', restSeconds: 30 },
        { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 30 },
        { name: 'Stiff com Halteres', muscleGroup: 'Posterior', sets: 3, reps: '12-15', restSeconds: 30 },
        { name: 'Tríceps no Banco', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 30 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 30 },
        { name: 'Burpees', muscleGroup: 'Full Body', sets: 3, reps: '10', restSeconds: 45 },
        { name: 'Abdominal Bicicleta', muscleGroup: 'Abdômen', sets: 3, reps: '20', restSeconds: 60, notes: 'Descanse 2min e repita o circuito' },
      ]
    },
    {
      name: 'HIIT + Core',
      exercises: [
        { name: 'Corrida Estacionária', muscleGroup: 'Cardio', sets: 1, reps: '5min', restSeconds: 60, notes: 'Aquecimento' },
        { name: 'Sprint + Caminhada', muscleGroup: 'Cardio', sets: 8, reps: '30s/30s', restSeconds: 0, notes: '30s intenso, 30s leve' },
        { name: 'Prancha Lateral', muscleGroup: 'Oblíquos', sets: 3, reps: '30s cada lado', restSeconds: 30 },
        { name: 'Crunch', muscleGroup: 'Abdômen', sets: 3, reps: '20', restSeconds: 30 },
        { name: 'Elevação de Pernas', muscleGroup: 'Abdômen Inferior', sets: 3, reps: '15', restSeconds: 30 },
        { name: 'Russian Twist', muscleGroup: 'Oblíquos', sets: 3, reps: '20', restSeconds: 30 },
      ]
    }
  ]
};

// ==================== TEMPLATES DE RECOMPOSIÇÃO CORPORAL ====================

export const recompositionTemplate: WorkoutTemplate = {
  id: 'recomposition-balanced',
  name: 'Recomposição Corporal - Balanceado',
  description: 'Treino para perder gordura enquanto ganha massa muscular. Combina força com cardio moderado.',
  goal: 'recomposition',
  difficulty: 'intermediate',
  daysPerWeek: 4,
  type: 'mixed',
  days: [
    {
      name: 'Upper Body A - Push',
      exercises: [
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Supino Inclinado Halteres', muscleGroup: 'Peito', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Desenvolvimento Máquina', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Corda', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Cardio LISS', muscleGroup: 'Cardio', sets: 1, reps: '15min', restSeconds: 0, notes: 'Esteira ou bike em ritmo moderado' },
      ]
    },
    {
      name: 'Lower Body A',
      exercises: [
        { name: 'Agachamento', muscleGroup: 'Quadríceps', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Leg Press', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Panturrilha', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
      ]
    },
    {
      name: 'Upper Body B - Pull',
      exercises: [
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Face Pull', muscleGroup: 'Ombro Posterior', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Cardio LISS', muscleGroup: 'Cardio', sets: 1, reps: '15min', restSeconds: 0, notes: 'Esteira ou bike em ritmo moderado' },
      ]
    },
    {
      name: 'Lower Body B + Core',
      exercises: [
        { name: 'Levantamento Terra', muscleGroup: 'Posterior', sets: 4, reps: '6-8', restSeconds: 180 },
        { name: 'Bulgarian Split Squat', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12 cada', restSeconds: 60 },
        { name: 'Cadeira Abdutora', muscleGroup: 'Glúteos', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Cadeira Adutora', muscleGroup: 'Adutores', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '45-60s', restSeconds: 45 },
        { name: 'Abdominal Infra', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    }
  ]
};

// ==================== TEMPLATES DE BULKING ====================

export const bulkingTemplate: WorkoutTemplate = {
  id: 'bulking-mass',
  name: 'Bulking - Ganho de Massa',
  description: 'Treino focado em ganho máximo de massa muscular. Alto volume e cargas progressivas.',
  goal: 'bulking',
  difficulty: 'intermediate',
  daysPerWeek: 5,
  type: 'strength',
  days: [
    {
      name: 'Peito',
      exercises: [
        { name: 'Supino Reto com Barra', muscleGroup: 'Peito', sets: 5, reps: '5-8', restSeconds: 180 },
        { name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Supino Declinado', muscleGroup: 'Peito', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Crossover Alto', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Pullover', muscleGroup: 'Peito/Costas', sets: 3, reps: '12-15', restSeconds: 60 },
      ]
    },
    {
      name: 'Costas',
      exercises: [
        { name: 'Barra Fixa', muscleGroup: 'Costas', sets: 4, reps: 'Máximo', restSeconds: 120 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 5, reps: '6-8', restSeconds: 120 },
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Remada Cavalinho', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Pulldown Pegada Fechada', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
      ]
    },
    {
      name: 'Ombros e Trapézio',
      exercises: [
        { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', sets: 5, reps: '6-8', restSeconds: 120 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Elevação Frontal', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Crucifixo Invertido', muscleGroup: 'Ombro Posterior', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Encolhimento com Barra', muscleGroup: 'Trapézio', sets: 4, reps: '10-12', restSeconds: 60 },
      ]
    },
    {
      name: 'Pernas',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 5, reps: '5-8', restSeconds: 180 },
        { name: 'Leg Press', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 120 },
        { name: 'Hack Squat', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 5, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Braços',
      exercises: [
        { name: 'Rosca Direta com Barra', muscleGroup: 'Bíceps', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Rosca Scott', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Tríceps Testa', muscleGroup: 'Tríceps', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Tríceps Coice', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Rosca Punho', muscleGroup: 'Antebraço', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    }
  ]
};

// ==================== TEMPLATES DE CUTTING ====================

export const cuttingTemplate: WorkoutTemplate = {
  id: 'cutting-definition',
  name: 'Cutting - Definição Muscular',
  description: 'Treino para fase de cutting. Mantém massa muscular enquanto maximiza queima de gordura.',
  goal: 'cutting',
  difficulty: 'intermediate',
  daysPerWeek: 4,
  type: 'mixed',
  days: [
    {
      name: 'Upper Body A',
      exercises: [
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Desenvolvimento', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Tríceps + Bíceps (Bi-set)', muscleGroup: 'Braços', sets: 3, reps: '12-15', restSeconds: 45, notes: 'Sem descanso entre tríceps e bíceps' },
        { name: 'HIIT Esteira', muscleGroup: 'Cardio', sets: 1, reps: '15min', restSeconds: 0, notes: '30s sprint / 30s caminhada' },
      ]
    },
    {
      name: 'Lower Body A',
      exercises: [
        { name: 'Agachamento', muscleGroup: 'Quadríceps', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Leg Press', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Panturrilha', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Abdominal Circuito', muscleGroup: 'Core', sets: 3, reps: '15 cada', restSeconds: 30, notes: 'Crunch + Prancha + Oblíquo' },
      ]
    },
    {
      name: 'Upper Body B',
      exercises: [
        { name: 'Supino Inclinado', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Face Pull', muscleGroup: 'Ombro Posterior', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Rosca + Tríceps (Bi-set)', muscleGroup: 'Braços', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'HIIT Bike', muscleGroup: 'Cardio', sets: 1, reps: '15min', restSeconds: 0, notes: '20s máximo / 40s leve' },
      ]
    },
    {
      name: 'Lower Body B + Cardio',
      exercises: [
        { name: 'Levantamento Terra', muscleGroup: 'Posterior', sets: 4, reps: '6-8', restSeconds: 120 },
        { name: 'Bulgarian Split Squat', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12 cada', restSeconds: 60 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Glúteo na Máquina', muscleGroup: 'Glúteos', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Cardio LISS', muscleGroup: 'Cardio', sets: 1, reps: '25min', restSeconds: 0, notes: 'Caminhada inclinada ou bike leve' },
      ]
    }
  ]
};

// ==================== TEMPLATE PARA INICIANTES ====================

export const beginnerFullBody: WorkoutTemplate = {
  id: 'beginner-fullbody',
  name: 'Iniciante - Full Body',
  description: 'Treino completo para iniciantes. Foco em aprender os movimentos básicos com segurança.',
  goal: 'general',
  difficulty: 'none',
  daysPerWeek: 3,
  type: 'strength',
  days: [
    {
      name: 'Full Body A',
      exercises: [
        { name: 'Agachamento no Smith', muscleGroup: 'Pernas', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Foco na técnica' },
        { name: 'Supino na Máquina', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Desenvolvimento na Máquina', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Leg Press', muscleGroup: 'Pernas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '20-30s', restSeconds: 45 },
      ]
    },
    {
      name: 'Full Body B',
      exercises: [
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Supino Inclinado Máquina', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Remada na Máquina', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    },
    {
      name: 'Full Body C',
      exercises: [
        { name: 'Afundo no Smith', muscleGroup: 'Pernas', sets: 3, reps: '10-12 cada', restSeconds: 60 },
        { name: 'Crucifixo na Máquina', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Pulldown', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps na Máquina', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Rosca na Máquina', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    }
  ]
};

// ==================== PLANOS MENSAIS PRÉ-DEFINIDOS (1x a 6x semana) ====================

// Plano 1x por semana - Full Body
export const plan1xWeek: WorkoutTemplate = {
  id: 'plan-1x-week',
  name: 'Plano 1x Semana - Full Body',
  description: 'Treino completo para quem pode treinar apenas 1x por semana. Máximo aproveitamento em uma única sessão.',
  goal: 'general',
  difficulty: 'beginner',
  daysPerWeek: 1,
  type: 'strength',
  days: [
    {
      name: 'Full Body Completo',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Pernas', sets: 4, reps: '10-12', restSeconds: 120 },
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Desenvolvimento', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '30-45s', restSeconds: 45 },
      ]
    }
  ]
};

// Plano 2x por semana - Upper/Lower
export const plan2xWeek: WorkoutTemplate = {
  id: 'plan-2x-week',
  name: 'Plano 2x Semana - Upper/Lower',
  description: 'Divisão superior/inferior para quem treina 2x por semana. Equilíbrio entre membros superiores e inferiores.',
  goal: 'general',
  difficulty: 'beginner',
  daysPerWeek: 2,
  type: 'strength',
  days: [
    {
      name: 'Upper Body (Membros Superiores)',
      exercises: [
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Desenvolvimento', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Crucifixo', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Lower Body (Membros Inferiores)',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 120 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '12-15', restSeconds: 90 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    }
  ]
};

// Plano 3x por semana - ABC
export const plan3xWeek: WorkoutTemplate = {
  id: 'plan-3x-week',
  name: 'Plano 3x Semana - ABC',
  description: 'Divisão clássica ABC para quem treina 3x por semana. Ideal para iniciantes e intermediários.',
  goal: 'hypertrophy',
  difficulty: 'beginner',
  daysPerWeek: 3,
  type: 'strength',
  days: [
    {
      name: 'Treino A - Peito, Ombro e Tríceps',
      exercises: [
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Supino Inclinado', muscleGroup: 'Peito', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Crucifixo', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Desenvolvimento', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Francês', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Pulldown', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Alternada', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino C - Pernas e Abdômen',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 120 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '12-15', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '30-45s', restSeconds: 45 },
      ]
    }
  ]
};

// Plano 4x por semana - ABCD
export const plan4xWeek: WorkoutTemplate = {
  id: 'plan-4x-week',
  name: 'Plano 4x Semana - ABCD',
  description: 'Divisão ABCD para quem treina 4x por semana. Maior volume por grupo muscular.',
  goal: 'hypertrophy',
  difficulty: 'intermediate',
  daysPerWeek: 4,
  type: 'strength',
  days: [
    {
      name: 'Treino A - Peito e Tríceps',
      exercises: [
        { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Supino Inclinado', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Crossover', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Crucifixo Inclinado', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Tríceps Pulley Corda', muscleGroup: 'Tríceps', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Testa', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Mergulho no Banco', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Barra Fixa', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 120, notes: 'Use assistência se necessário' },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Puxada Frontal Fechada', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Cavalinho', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Direta Barra W', muscleGroup: 'Bíceps', sets: 4, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Scott', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Concentrada', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino C - Ombros e Trapézio',
      exercises: [
        { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Elevação Frontal', muscleGroup: 'Ombros', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Crucifixo Invertido', muscleGroup: 'Ombro Posterior', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Encolhimento com Barra', muscleGroup: 'Trapézio', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Face Pull', muscleGroup: 'Ombro Posterior', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino D - Pernas Completo',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 5, reps: '6-8', restSeconds: 180 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Hack Squat', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '12-15', restSeconds: 45 },
      ]
    }
  ]
};

// Plano 5x por semana - ABCDE
export const plan5xWeek: WorkoutTemplate = {
  id: 'plan-5x-week',
  name: 'Plano 5x Semana - ABCDE',
  description: 'Divisão ABCDE para quem treina 5x por semana. Um grupo muscular por dia para máximo foco.',
  goal: 'hypertrophy',
  difficulty: 'intermediate',
  daysPerWeek: 5,
  type: 'strength',
  days: [
    {
      name: 'Treino A - Peito',
      exercises: [
        { name: 'Supino Reto com Barra', muscleGroup: 'Peito', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Supino Inclinado Halteres', muscleGroup: 'Peito Superior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Supino Declinado', muscleGroup: 'Peito Inferior', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Crossover Alto', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Crossover Baixo', muscleGroup: 'Peito Superior', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Pullover', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
      ]
    },
    {
      name: 'Treino B - Costas',
      exercises: [
        { name: 'Barra Fixa', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Puxada Frontal Aberta', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Cavalinho', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Pulldown', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
      ]
    },
    {
      name: 'Treino C - Ombros',
      exercises: [
        { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Desenvolvimento Arnold', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombro Lateral', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Elevação Frontal', muscleGroup: 'Ombro Anterior', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Crucifixo Invertido', muscleGroup: 'Ombro Posterior', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Encolhimento', muscleGroup: 'Trapézio', sets: 4, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino D - Pernas',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 5, reps: '6-8', restSeconds: 180 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Hack Squat', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 5, reps: '15-20', restSeconds: 45 },
        { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
      ]
    },
    {
      name: 'Treino E - Braços e Abdômen',
      exercises: [
        { name: 'Rosca Direta Barra', muscleGroup: 'Bíceps', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Scott', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Testa', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Tríceps Coice', muscleGroup: 'Tríceps', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Prancha', muscleGroup: 'Core', sets: 3, reps: '45-60s', restSeconds: 45 },
      ]
    }
  ]
};

// Plano 6x por semana - Push/Pull/Legs (2x)
export const plan6xWeek: WorkoutTemplate = {
  id: 'plan-6x-week',
  name: 'Plano 6x Semana - Push/Pull/Legs',
  description: 'Divisão Push/Pull/Legs repetida 2x na semana. Para avançados que buscam máximo volume.',
  goal: 'hypertrophy',
  difficulty: 'advanced',
  daysPerWeek: 6,
  type: 'strength',
  days: [
    {
      name: 'Push A - Peito, Ombro, Tríceps (Força)',
      exercises: [
        { name: 'Supino Reto com Barra', muscleGroup: 'Peito', sets: 5, reps: '5-6', restSeconds: 180 },
        { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', sets: 4, reps: '6-8', restSeconds: 120 },
        { name: 'Supino Inclinado Halteres', muscleGroup: 'Peito', sets: 3, reps: '8-10', restSeconds: 90 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 4, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Tríceps Francês', muscleGroup: 'Tríceps', sets: 3, reps: '10-12', restSeconds: 45 },
      ]
    },
    {
      name: 'Pull A - Costas, Bíceps (Força)',
      exercises: [
        { name: 'Barra Fixa', muscleGroup: 'Costas', sets: 4, reps: '6-8', restSeconds: 120 },
        { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '6-8', restSeconds: 120 },
        { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: '8-10', restSeconds: 90 },
        { name: 'Remada Cavalinho', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Rosca Direta', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Martelo', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
      ]
    },
    {
      name: 'Legs A - Pernas (Força)',
      exercises: [
        { name: 'Agachamento Livre', muscleGroup: 'Quadríceps', sets: 5, reps: '5-6', restSeconds: 180 },
        { name: 'Leg Press 45°', muscleGroup: 'Quadríceps', sets: 4, reps: '8-10', restSeconds: 120 },
        { name: 'Stiff', muscleGroup: 'Posterior', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', sets: 4, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Push B - Peito, Ombro, Tríceps (Hipertrofia)',
      exercises: [
        { name: 'Supino Inclinado', muscleGroup: 'Peito', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Crossover', muscleGroup: 'Peito', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Desenvolvimento Arnold', muscleGroup: 'Ombros', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Elevação Lateral', muscleGroup: 'Ombros', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Crucifixo Invertido', muscleGroup: 'Ombro Posterior', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Tríceps Corda', muscleGroup: 'Tríceps', sets: 4, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Pull B - Costas, Bíceps (Hipertrofia)',
      exercises: [
        { name: 'Puxada Frontal Aberta', muscleGroup: 'Costas', sets: 4, reps: '10-12', restSeconds: 60 },
        { name: 'Remada Unilateral', muscleGroup: 'Costas', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Pulldown', muscleGroup: 'Costas', sets: 3, reps: '12-15', restSeconds: 60 },
        { name: 'Face Pull', muscleGroup: 'Ombro Posterior', sets: 3, reps: '15-20', restSeconds: 45 },
        { name: 'Rosca Scott', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', restSeconds: 45 },
        { name: 'Rosca Concentrada', muscleGroup: 'Bíceps', sets: 3, reps: '12-15', restSeconds: 45 },
      ]
    },
    {
      name: 'Legs B - Pernas (Hipertrofia)',
      exercises: [
        { name: 'Hack Squat', muscleGroup: 'Quadríceps', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Afundo', muscleGroup: 'Quadríceps', sets: 3, reps: '10-12 cada', restSeconds: 60 },
        { name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Mesa Flexora', muscleGroup: 'Posterior', sets: 4, reps: '12-15', restSeconds: 60 },
        { name: 'Glúteo na Máquina', muscleGroup: 'Glúteos', sets: 3, reps: '12-15', restSeconds: 45 },
        { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', sets: 4, reps: '15-20', restSeconds: 45 },
        { name: 'Abdominal', muscleGroup: 'Abdômen', sets: 3, reps: '15-20', restSeconds: 45 },
      ]
    }
  ]
};

// Lista de todos os templates disponíveis
export const allWorkoutTemplates: WorkoutTemplate[] = [
  // Planos mensais pré-definidos (1x a 6x semana)
  plan1xWeek,
  plan2xWeek,
  plan3xWeek,
  plan4xWeek,
  plan5xWeek,
  plan6xWeek,
  // Templates específicos por objetivo
  beginnerFullBody,
  hypertrophyBeginnerABC,
  hypertrophyIntermediateABCD,
  weightLossCircuit,
  recompositionTemplate,
  bulkingTemplate,
  cuttingTemplate,
];

// Função para buscar templates por objetivo
export function getTemplatesByGoal(goal: WorkoutGoal): WorkoutTemplate[] {
  return allWorkoutTemplates.filter(t => t.goal === goal);
}

// Função para buscar templates por nível
export function getTemplatesByLevel(level: ExperienceLevel): WorkoutTemplate[] {
  return allWorkoutTemplates.filter(t => t.difficulty === level);
}

// Função para buscar template por ID
export function getTemplateById(id: string): WorkoutTemplate | undefined {
  return allWorkoutTemplates.find(t => t.id === id);
}

// Mapeamento de objetivos para labels em português
export const goalLabels: Record<WorkoutGoal, string> = {
  hypertrophy: 'Hipertrofia',
  weight_loss: 'Emagrecimento',
  recomposition: 'Recomposição Corporal',
  conditioning: 'Condicionamento',
  strength: 'Força',
  bulking: 'Bulking (Ganho de Massa)',
  cutting: 'Cutting (Definição)',
  general: 'Geral',
};

// Mapeamento de níveis para labels em português
export const levelLabels: Record<ExperienceLevel, string> = {
  none: 'Iniciante Total',
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};
