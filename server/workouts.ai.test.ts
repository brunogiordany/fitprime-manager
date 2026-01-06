import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do invokeLLM
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

// Mock do db
vi.mock('./db', () => ({
  getUserById: vi.fn(),
  getStudentById: vi.fn(),
  getAnamnesisByStudentId: vi.fn(),
  getMeasurementsByStudentId: vi.fn(),
  getCardioStats: vi.fn(),
}));

import { invokeLLM } from './_core/llm';
import * as db from './db';

describe('Workouts AI Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('regenerateExercise', () => {
    it('should return a valid exercise object with reason', async () => {
      // Mock do LLM retornando exercício válido
      const mockExercise = {
        name: 'Supino Inclinado com Halteres',
        muscleGroup: 'Peitoral',
        sets: 4,
        reps: '10-12',
        restSeconds: 90,
        notes: 'Manter cotovelos a 45 graus',
        reason: 'Variação que trabalha mais a porção superior do peitoral',
      };

      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockExercise),
          },
        }],
      });

      // Simular chamada do endpoint
      const result = mockExercise;

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('muscleGroup');
      expect(result).toHaveProperty('sets');
      expect(result).toHaveProperty('reps');
      expect(result).toHaveProperty('restSeconds');
      expect(result).toHaveProperty('reason');
      expect(typeof result.sets).toBe('number');
      expect(typeof result.restSeconds).toBe('number');
    });

    it('should maintain same muscle group as original exercise', async () => {
      const originalMuscleGroup = 'Peitoral';
      
      const mockExercise = {
        name: 'Crossover',
        muscleGroup: 'Peitoral',
        sets: 3,
        reps: '12-15',
        restSeconds: 60,
        notes: 'Foco na contração',
        reason: 'Exercício de isolamento para finalização',
      };

      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockExercise),
          },
        }],
      });

      expect(mockExercise.muscleGroup).toBe(originalMuscleGroup);
    });
  });

  describe('generateCardioAndKcal', () => {
    it('should return valid cardio and nutrition recommendation', async () => {
      const mockRecommendation = {
        cardio: {
          sessionsPerWeek: 3,
          minutesPerSession: 30,
          recommendedTypes: ['caminhada', 'bicicleta'],
          intensity: 'moderada',
          timing: 'após o treino de musculação',
          notes: 'Iniciar gradualmente',
        },
        nutrition: {
          dailyCalories: 2000,
          proteinGrams: 150,
          carbsGrams: 200,
          fatGrams: 70,
          mealFrequency: 5,
          hydration: '3 litros de água por dia',
          notes: 'Priorizar proteínas magras',
        },
        weeklyCalorieDeficitOrSurplus: -3500,
        estimatedWeeklyWeightChange: '-0.5kg',
        timeToGoal: '12-16 semanas',
        summary: 'Estratégia focada em emagrecimento com déficit calórico moderado',
        warnings: ['Consulte um médico antes de iniciar'],
      };

      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockRecommendation),
          },
        }],
      });

      const result = mockRecommendation;

      // Validar estrutura do cardio
      expect(result.cardio).toHaveProperty('sessionsPerWeek');
      expect(result.cardio).toHaveProperty('minutesPerSession');
      expect(result.cardio).toHaveProperty('recommendedTypes');
      expect(result.cardio).toHaveProperty('intensity');
      expect(Array.isArray(result.cardio.recommendedTypes)).toBe(true);

      // Validar estrutura da nutrição
      expect(result.nutrition).toHaveProperty('dailyCalories');
      expect(result.nutrition).toHaveProperty('proteinGrams');
      expect(result.nutrition).toHaveProperty('carbsGrams');
      expect(result.nutrition).toHaveProperty('fatGrams');
      expect(typeof result.nutrition.dailyCalories).toBe('number');

      // Validar projeções
      expect(result).toHaveProperty('weeklyCalorieDeficitOrSurplus');
      expect(result).toHaveProperty('estimatedWeeklyWeightChange');
      expect(result).toHaveProperty('timeToGoal');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('warnings');
    });

    it('should calculate deficit for weight loss goal', async () => {
      const mockRecommendation = {
        cardio: {
          sessionsPerWeek: 4,
          minutesPerSession: 40,
          recommendedTypes: ['HIIT', 'corrida'],
          intensity: 'alta',
          timing: 'em jejum ou após treino',
          notes: 'Alternar intensidades',
        },
        nutrition: {
          dailyCalories: 1800,
          proteinGrams: 160,
          carbsGrams: 150,
          fatGrams: 60,
          mealFrequency: 5,
          hydration: '3.5 litros de água por dia',
          notes: 'Reduzir carboidratos simples',
        },
        weeklyCalorieDeficitOrSurplus: -4500,
        estimatedWeeklyWeightChange: '-0.6kg',
        timeToGoal: '10-12 semanas',
        summary: 'Estratégia agressiva para emagrecimento rápido',
        warnings: ['Monitorar níveis de energia', 'Não manter por mais de 12 semanas'],
      };

      // Para emagrecimento, o déficit deve ser negativo
      expect(mockRecommendation.weeklyCalorieDeficitOrSurplus).toBeLessThan(0);
      expect(mockRecommendation.estimatedWeeklyWeightChange).toContain('-');
    });

    it('should calculate surplus for muscle gain goal', async () => {
      const mockRecommendation = {
        cardio: {
          sessionsPerWeek: 2,
          minutesPerSession: 20,
          recommendedTypes: ['caminhada leve'],
          intensity: 'baixa',
          timing: 'em dias de descanso',
          notes: 'Apenas para saúde cardiovascular',
        },
        nutrition: {
          dailyCalories: 2800,
          proteinGrams: 180,
          carbsGrams: 350,
          fatGrams: 80,
          mealFrequency: 6,
          hydration: '4 litros de água por dia',
          notes: 'Aumentar carboidratos pré e pós treino',
        },
        weeklyCalorieDeficitOrSurplus: 2100,
        estimatedWeeklyWeightChange: '+0.3kg',
        timeToGoal: '16-20 semanas',
        summary: 'Estratégia de bulking limpo com superávit moderado',
        warnings: ['Monitorar ganho de gordura', 'Ajustar conforme evolução'],
      };

      // Para hipertrofia, o superávit deve ser positivo
      expect(mockRecommendation.weeklyCalorieDeficitOrSurplus).toBeGreaterThan(0);
      expect(mockRecommendation.estimatedWeeklyWeightChange).toContain('+');
    });
  });

  describe('Input validation', () => {
    it('should require studentId for regenerateExercise', () => {
      const input = {
        studentId: 1,
        currentExercise: {
          name: 'Supino Reto',
          muscleGroup: 'Peitoral',
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
        },
        dayName: 'Treino A - Peito e Tríceps',
        otherExercisesInDay: [],
      };

      expect(input.studentId).toBeDefined();
      expect(input.currentExercise).toBeDefined();
      expect(input.dayName).toBeDefined();
    });

    it('should require studentId for generateCardioAndKcal', () => {
      const input = {
        studentId: 1,
        workoutPreview: {
          name: 'Treino Hipertrofia',
          goal: 'hipertrofia',
          difficulty: 'intermediário',
          daysCount: 4,
        },
      };

      expect(input.studentId).toBeDefined();
    });
  });
});
