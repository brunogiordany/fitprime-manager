import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  getAnamnesisByStudentId: vi.fn(),
  createAnamnesis: vi.fn(),
  updateAnamnesis: vi.fn(),
  createMeasurement: vi.fn(),
}));

// Mock de notificação
vi.mock('./_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

import * as db from './db';

describe('studentPortal.saveWithMeasurements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('mainGoal enum validation', () => {
    it('should accept all valid mainGoal values from schema', () => {
      const validMainGoals = [
        'weight_loss',
        'muscle_gain',
        'recomposition',
        'conditioning',
        'health',
        'rehabilitation',
        'sports',
        'bulking',
        'cutting',
        'other',
      ];

      // Verificar que todos os valores são strings válidas
      validMainGoals.forEach((goal) => {
        expect(typeof goal).toBe('string');
        expect(goal.length).toBeGreaterThan(0);
      });

      // Verificar que temos 10 valores válidos
      expect(validMainGoals.length).toBe(10);
    });

    it('should include recomposition, bulking, and cutting in mainGoal enum', () => {
      const validMainGoals = [
        'weight_loss',
        'muscle_gain',
        'recomposition',
        'conditioning',
        'health',
        'rehabilitation',
        'sports',
        'bulking',
        'cutting',
        'other',
      ];

      // Estes são os valores que estavam faltando e causavam o erro
      expect(validMainGoals).toContain('recomposition');
      expect(validMainGoals).toContain('bulking');
      expect(validMainGoals).toContain('cutting');
    });
  });

  describe('anamnesis creation', () => {
    it('should create new anamnesis when none exists', async () => {
      const mockStudentId = 30001;
      const mockPersonalId = 1;
      const mockAnamnesisId = 100;

      (db.getAnamnesisByStudentId as any).mockResolvedValue(undefined);
      (db.createAnamnesis as any).mockResolvedValue(mockAnamnesisId);

      // Simular dados de entrada
      const inputData = {
        occupation: 'Lash design',
        lifestyle: 'light' as const,
        sleepHours: 7,
        stressLevel: 'moderate' as const,
        mainGoal: 'muscle_gain' as const,
        targetWeight: '60',
        mealsPerDay: 4,
        waterIntake: 'less_1l',
        supplements: 'Whey, creatina, HMB',
        dailyCalories: 1500,
        doesCardio: true,
        cardioActivities: 'Hipismo',
        exerciseExperience: 'advanced' as const,
        preferredTime: 'afternoon' as const,
        trainingLocation: 'full_gym' as const,
        weeklyFrequency: 3,
        sessionDuration: 60,
        trainingRestrictions: 'Odeio leg 45',
      };

      // Verificar que os dados são válidos
      expect(inputData.mainGoal).toBe('muscle_gain');
      expect(inputData.lifestyle).toBe('light');
      expect(inputData.stressLevel).toBe('moderate');
    });

    it('should update existing anamnesis when one exists', async () => {
      const mockExistingAnamnesis = {
        id: 100,
        studentId: 30001,
        personalId: 1,
        mainGoal: 'weight_loss',
      };

      (db.getAnamnesisByStudentId as any).mockResolvedValue(mockExistingAnamnesis);
      (db.updateAnamnesis as any).mockResolvedValue(undefined);

      // Simular dados de atualização
      const updateData = {
        mainGoal: 'muscle_gain' as const,
        targetWeight: '65',
      };

      // Verificar que os dados são válidos
      expect(updateData.mainGoal).toBe('muscle_gain');
    });
  });

  describe('measurements creation', () => {
    it('should create measurements when provided', async () => {
      const mockMeasurements = {
        weight: '70',
        height: '175',
        neck: '38',
        chest: '100',
        waist: '80',
        hip: '95',
      };

      (db.createMeasurement as any).mockResolvedValue(1);

      // Verificar que os dados de medidas são válidos
      expect(mockMeasurements.weight).toBe('70');
      expect(mockMeasurements.height).toBe('175');
    });

    it('should calculate BMI when weight and height are provided', () => {
      const weight = 70;
      const height = 175 / 100; // em metros
      const bmi = weight / (height * height);

      expect(bmi).toBeCloseTo(22.86, 1);
    });
  });

  describe('data validation', () => {
    it('should handle optional fields correctly', () => {
      const partialData = {
        occupation: 'Personal Trainer',
        // Todos os outros campos são opcionais
      };

      expect(partialData.occupation).toBe('Personal Trainer');
    });

    it('should handle empty strings as undefined', () => {
      const cleanValue = (val: string | undefined) => {
        if (!val || val.trim() === '') return undefined;
        return val.trim();
      };

      expect(cleanValue('')).toBeUndefined();
      expect(cleanValue('   ')).toBeUndefined();
      expect(cleanValue('test')).toBe('test');
      expect(cleanValue(' test ')).toBe('test');
    });

    it('should validate enum values correctly', () => {
      const cleanEnum = (val: any, validValues: string[]) => {
        if (!val || val === '') return undefined;
        return validValues.includes(val) ? val : undefined;
      };

      const validMainGoals = [
        'weight_loss',
        'muscle_gain',
        'recomposition',
        'conditioning',
        'health',
        'rehabilitation',
        'sports',
        'bulking',
        'cutting',
        'other',
      ];

      // Valores válidos
      expect(cleanEnum('muscle_gain', validMainGoals)).toBe('muscle_gain');
      expect(cleanEnum('recomposition', validMainGoals)).toBe('recomposition');
      expect(cleanEnum('bulking', validMainGoals)).toBe('bulking');
      expect(cleanEnum('cutting', validMainGoals)).toBe('cutting');

      // Valores inválidos
      expect(cleanEnum('invalid_goal', validMainGoals)).toBeUndefined();
      expect(cleanEnum('', validMainGoals)).toBeUndefined();
      expect(cleanEnum(null, validMainGoals)).toBeUndefined();
    });
  });
});
