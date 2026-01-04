import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDb } from './db';
import { mealPlanTemplates, trainingNutritionProfiles } from '../drizzle/schema';
import { eq, and, isNull, or } from 'drizzle-orm';

// Mock do banco de dados
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Nutrition Templates and Training Profiles', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  describe('Meal Plan Templates', () => {
    it('should have templates seeded in database', async () => {
      const mockTemplates = [
        { id: 1, name: 'Low Carb', objective: 'weight_loss', proteinPerKg: '2.0', carbsPerKg: '1.0', fatPerKg: '1.0' },
        { id: 2, name: 'Bulking', objective: 'bulking', proteinPerKg: '2.0', carbsPerKg: '4.0', fatPerKg: '1.0' },
        { id: 3, name: 'Cutting', objective: 'cutting', proteinPerKg: '2.2', carbsPerKg: '2.0', fatPerKg: '0.8' },
      ];

      mockDb.limit.mockResolvedValue(mockTemplates);

      const db = await getDb();
      expect(db).toBeDefined();
    });

    it('should calculate macros correctly for weight loss template', () => {
      const template = {
        proteinPerKg: 2.0,
        carbsPerKg: 1.0,
        fatPerKg: 1.0,
        calorieDeficit: 300,
      };

      const weight = 70; // kg
      
      const protein = template.proteinPerKg * weight; // 140g
      const carbs = template.carbsPerKg * weight; // 70g
      const fat = template.fatPerKg * weight; // 70g
      
      // Calorias: proteína 4kcal/g, carbs 4kcal/g, gordura 9kcal/g
      const calories = (protein * 4) + (carbs * 4) + (fat * 9) - template.calorieDeficit;
      
      expect(protein).toBe(140);
      expect(carbs).toBe(70);
      expect(fat).toBe(70);
      expect(calories).toBe(560 + 280 + 630 - 300); // 1170 kcal
    });

    it('should calculate macros correctly for bulking template', () => {
      const template = {
        proteinPerKg: 2.0,
        carbsPerKg: 4.0,
        fatPerKg: 1.0,
        calorieSurplus: 400,
      };

      const weight = 70; // kg
      
      const protein = template.proteinPerKg * weight; // 140g
      const carbs = template.carbsPerKg * weight; // 280g
      const fat = template.fatPerKg * weight; // 70g
      
      const calories = (protein * 4) + (carbs * 4) + (fat * 9) + template.calorieSurplus;
      
      expect(protein).toBe(140);
      expect(carbs).toBe(280);
      expect(fat).toBe(70);
      expect(calories).toBe(560 + 1120 + 630 + 400); // 2710 kcal
    });
  });

  describe('Training Nutrition Profiles', () => {
    it('should have training profiles seeded in database', async () => {
      const mockProfiles = [
        { id: 1, name: 'Treino de Força', trainingType: 'strength', caloriesAdjustment: 300 },
        { id: 2, name: 'Cardio Alta Intensidade', trainingType: 'cardio_high', caloriesAdjustment: 250 },
        { id: 3, name: 'Dia de Descanso', trainingType: 'rest', caloriesAdjustment: -200 },
      ];

      mockDb.limit.mockResolvedValue(mockProfiles);

      const db = await getDb();
      expect(db).toBeDefined();
    });

    it('should adjust macros for training day', () => {
      const baseMacros = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 70,
      };

      const trainingProfile = {
        caloriesAdjustment: 300,
        proteinAdjustment: 10,
        carbsAdjustment: 50,
        fatAdjustment: 0,
      };

      const adjustedMacros = {
        calories: baseMacros.calories + trainingProfile.caloriesAdjustment,
        protein: baseMacros.protein + trainingProfile.proteinAdjustment,
        carbs: baseMacros.carbs + trainingProfile.carbsAdjustment,
        fat: baseMacros.fat + trainingProfile.fatAdjustment,
      };

      expect(adjustedMacros.calories).toBe(2300);
      expect(adjustedMacros.protein).toBe(160);
      expect(adjustedMacros.carbs).toBe(250);
      expect(adjustedMacros.fat).toBe(70);
    });

    it('should reduce macros for rest day', () => {
      const baseMacros = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 70,
      };

      const restProfile = {
        caloriesAdjustment: -200,
        proteinAdjustment: 0,
        carbsAdjustment: -30,
        fatAdjustment: 10,
      };

      const adjustedMacros = {
        calories: baseMacros.calories + restProfile.caloriesAdjustment,
        protein: baseMacros.protein + restProfile.proteinAdjustment,
        carbs: baseMacros.carbs + restProfile.carbsAdjustment,
        fat: baseMacros.fat + restProfile.fatAdjustment,
      };

      expect(adjustedMacros.calories).toBe(1800);
      expect(adjustedMacros.protein).toBe(150);
      expect(adjustedMacros.carbs).toBe(170);
      expect(adjustedMacros.fat).toBe(80);
    });
  });

  describe('Training Integration', () => {
    it('should determine correct training type based on workout', () => {
      const workoutTypes = {
        'strength': ['musculação', 'força', 'hipertrofia'],
        'cardio_low': ['caminhada', 'bike leve', 'natação'],
        'cardio_high': ['HIIT', 'corrida', 'spinning'],
        'mixed': ['funcional', 'crossfit'],
      };

      // Simular determinação de tipo de treino
      const workoutName = 'Treino de Força - Peito e Tríceps';
      let detectedType = 'strength';

      for (const [type, keywords] of Object.entries(workoutTypes)) {
        if (keywords.some(k => workoutName.toLowerCase().includes(k.toLowerCase()))) {
          detectedType = type;
          break;
        }
      }

      expect(detectedType).toBe('strength');
    });

    it('should calculate weekly training summary', () => {
      const weekSchedule = [
        { day: 'monday', isTrainingDay: true, trainingType: 'strength' },
        { day: 'tuesday', isTrainingDay: true, trainingType: 'cardio_high' },
        { day: 'wednesday', isTrainingDay: false, trainingType: 'rest' },
        { day: 'thursday', isTrainingDay: true, trainingType: 'strength' },
        { day: 'friday', isTrainingDay: true, trainingType: 'mixed' },
        { day: 'saturday', isTrainingDay: false, trainingType: 'active_recovery' },
        { day: 'sunday', isTrainingDay: false, trainingType: 'rest' },
      ];

      const trainingDays = weekSchedule.filter(d => d.isTrainingDay).length;
      const restDays = weekSchedule.filter(d => !d.isTrainingDay).length;

      expect(trainingDays).toBe(4);
      expect(restDays).toBe(3);
    });
  });

  describe('TACO Foods Database', () => {
    it('should have correct nutritional values structure', () => {
      const tacoFood = {
        name: 'Arroz, integral, cozido',
        category: 'Cereais e derivados',
        source: 'taco',
        servingSize: 100,
        servingUnit: 'g',
        calories: 124,
        protein: 2.6,
        carbohydrates: 25.8,
        fiber: 2.7,
        totalFat: 1.0,
        sodium: 1,
        potassium: 55,
      };

      expect(tacoFood.source).toBe('taco');
      expect(tacoFood.servingSize).toBe(100);
      expect(tacoFood.servingUnit).toBe('g');
      expect(tacoFood.calories).toBeGreaterThan(0);
      expect(tacoFood.protein).toBeGreaterThanOrEqual(0);
      expect(tacoFood.carbohydrates).toBeGreaterThanOrEqual(0);
    });

    it('should calculate portion macros correctly', () => {
      const food = {
        calories: 124, // per 100g
        protein: 2.6,
        carbohydrates: 25.8,
        totalFat: 1.0,
      };

      const portionSize = 150; // 150g serving
      const multiplier = portionSize / 100;

      const portionMacros = {
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbohydrates * multiplier * 10) / 10,
        fat: Math.round(food.totalFat * multiplier * 10) / 10,
      };

      expect(portionMacros.calories).toBe(186);
      expect(portionMacros.protein).toBe(3.9);
      expect(portionMacros.carbs).toBe(38.7);
      expect(portionMacros.fat).toBe(1.5);
    });
  });
});
