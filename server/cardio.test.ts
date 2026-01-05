import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock das funções do banco de dados
vi.mock('./db', () => ({
  getCardioLogsByStudentId: vi.fn(),
  createCardioLog: vi.fn(),
  updateCardioLog: vi.fn(),
  deleteCardioLog: vi.fn(),
  getCardioStats: vi.fn(),
  getCardioLogById: vi.fn(),
}));

import * as db from './db';

describe('Cardio Logs - Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCardioLogsByStudentId', () => {
    it('should return cardio logs for a student', async () => {
      const mockLogs = [
        {
          id: 1,
          studentId: 1,
          personalId: 1,
          cardioDate: new Date('2025-01-04'),
          cardioType: 'treadmill',
          durationMinutes: 30,
          distanceKm: '5.0',
          caloriesBurned: 300,
          avgHeartRate: 140,
        },
        {
          id: 2,
          studentId: 1,
          personalId: 1,
          cardioDate: new Date('2025-01-03'),
          cardioType: 'outdoor_run',
          durationMinutes: 45,
          distanceKm: '7.5',
          caloriesBurned: 450,
          avgHeartRate: 150,
        },
      ];

      (db.getCardioLogsByStudentId as any).mockResolvedValue(mockLogs);

      const result = await db.getCardioLogsByStudentId(1, 1);

      expect(db.getCardioLogsByStudentId).toHaveBeenCalledWith(1, 1);
      expect(result).toHaveLength(2);
      expect(result[0].cardioType).toBe('treadmill');
      expect(result[1].cardioType).toBe('outdoor_run');
    });

    it('should return empty array when no logs exist', async () => {
      (db.getCardioLogsByStudentId as any).mockResolvedValue([]);

      const result = await db.getCardioLogsByStudentId(999, 1);

      expect(result).toHaveLength(0);
    });
  });

  describe('createCardioLog', () => {
    it('should create a new cardio log', async () => {
      const newLog = {
        studentId: 1,
        personalId: 1,
        cardioDate: new Date('2025-01-04'),
        cardioType: 'swimming' as const,
        durationMinutes: 60,
        distanceKm: '2.0',
        caloriesBurned: 500,
        avgHeartRate: 130,
        intensity: 'moderate' as const,
        notes: 'Great swim session',
      };

      (db.createCardioLog as any).mockResolvedValue(1);

      const result = await db.createCardioLog(newLog);

      expect(db.createCardioLog).toHaveBeenCalledWith(newLog);
      expect(result).toBe(1);
    });
  });

  describe('updateCardioLog', () => {
    it('should update an existing cardio log', async () => {
      const updateData = {
        durationMinutes: 45,
        distanceKm: '6.0',
        caloriesBurned: 350,
      };

      (db.updateCardioLog as any).mockResolvedValue(undefined);

      await db.updateCardioLog(1, 1, updateData);

      expect(db.updateCardioLog).toHaveBeenCalledWith(1, 1, updateData);
    });
  });

  describe('deleteCardioLog', () => {
    it('should delete a cardio log', async () => {
      (db.deleteCardioLog as any).mockResolvedValue(undefined);

      await db.deleteCardioLog(1, 1);

      expect(db.deleteCardioLog).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('getCardioStats', () => {
    it('should return cardio statistics for a student', async () => {
      const mockStats = {
        totalSessions: 10,
        totalDuration: 450,
        totalDistance: 75.5,
        totalCalories: 4500,
        avgDuration: 45,
        avgDistance: 7.55,
        avgHeartRate: 145,
        byType: {
          treadmill: { count: 5, duration: 200, distance: 30.0 },
          outdoor_run: { count: 3, duration: 150, distance: 35.5 },
          swimming: { count: 2, duration: 100, distance: 10.0 },
        },
      };

      (db.getCardioStats as any).mockResolvedValue(mockStats);

      const result = await db.getCardioStats(1, 1, 30);

      expect(db.getCardioStats).toHaveBeenCalledWith(1, 1, 30);
      expect(result.totalSessions).toBe(10);
      expect(result.totalDuration).toBe(450);
      expect(result.totalDistance).toBe(75.5);
      expect(result.totalCalories).toBe(4500);
      expect(Object.keys(result.byType)).toHaveLength(3);
    });

    it('should return empty stats when no logs exist', async () => {
      const emptyStats = {
        totalSessions: 0,
        totalDuration: 0,
        totalDistance: 0,
        totalCalories: 0,
        avgDuration: 0,
        avgDistance: 0,
        avgHeartRate: null,
        byType: {},
      };

      (db.getCardioStats as any).mockResolvedValue(emptyStats);

      const result = await db.getCardioStats(999, 1, 30);

      expect(result.totalSessions).toBe(0);
      expect(result.byType).toEqual({});
    });
  });

  describe('getCardioLogById', () => {
    it('should return a specific cardio log by ID', async () => {
      const mockLog = {
        id: 1,
        studentId: 1,
        personalId: 1,
        cardioDate: new Date('2025-01-04'),
        cardioType: 'treadmill',
        durationMinutes: 30,
        distanceKm: '5.0',
        caloriesBurned: 300,
        avgHeartRate: 140,
        maxHeartRate: 165,
        minHeartRate: 110,
        intensity: 'moderate',
        feelingBefore: 'good',
        feelingAfter: 'great',
        notes: 'Felt great!',
      };

      (db.getCardioLogById as any).mockResolvedValue(mockLog);

      const result = await db.getCardioLogById(1, 1);

      expect(db.getCardioLogById).toHaveBeenCalledWith(1, 1);
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.cardioType).toBe('treadmill');
    });

    it('should return null when log not found', async () => {
      (db.getCardioLogById as any).mockResolvedValue(null);

      const result = await db.getCardioLogById(999, 1);

      expect(result).toBeNull();
    });
  });
});

describe('Cardio Types Validation', () => {
  const validCardioTypes = [
    'treadmill',
    'outdoor_run',
    'stationary_bike',
    'outdoor_bike',
    'elliptical',
    'rowing',
    'stair_climber',
    'swimming',
    'jump_rope',
    'hiit',
    'walking',
    'hiking',
    'dance',
    'boxing',
    'crossfit',
    'sports',
    'other',
  ];

  it('should have all expected cardio types', () => {
    expect(validCardioTypes).toHaveLength(17);
    expect(validCardioTypes).toContain('treadmill');
    expect(validCardioTypes).toContain('outdoor_run');
    expect(validCardioTypes).toContain('swimming');
    expect(validCardioTypes).toContain('hiit');
  });
});

describe('Intensity Levels Validation', () => {
  const validIntensities = [
    'very_light',
    'light',
    'moderate',
    'vigorous',
    'maximum',
  ];

  it('should have all expected intensity levels', () => {
    expect(validIntensities).toHaveLength(5);
    expect(validIntensities).toContain('very_light');
    expect(validIntensities).toContain('moderate');
    expect(validIntensities).toContain('maximum');
  });
});

describe('Feeling Levels Validation', () => {
  const validFeelings = [
    'terrible',
    'bad',
    'okay',
    'good',
    'great',
  ];

  it('should have all expected feeling levels', () => {
    expect(validFeelings).toHaveLength(5);
    expect(validFeelings).toContain('terrible');
    expect(validFeelings).toContain('okay');
    expect(validFeelings).toContain('great');
  });
});
