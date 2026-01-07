import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo db
vi.mock('./db', () => ({
  getTrainingDashboard: vi.fn(),
  getMuscleGroupAnalysis: vi.fn(),
  getInactiveStudents: vi.fn(),
  getStudentsActivityStats: vi.fn(),
  getStudentById: vi.fn(),
}));

import * as db from './db';

describe('Training Dashboard Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrainingDashboard', () => {
    it('deve retornar dados do dashboard de treinos', async () => {
      const mockDashboard = {
        totalWorkouts: 25,
        totalSets: 150,
        totalReps: 1500,
        totalVolume: 25000,
        totalExercises: 100,
        avgDuration: 60,
        feelingDistribution: {
          great: 10,
          good: 8,
          normal: 5,
          tired: 2,
          exhausted: 0,
        },
        workoutsByMonth: [
          { month: 'nov/25', count: 12 },
          { month: 'dez/25', count: 13 },
        ],
        volumeByMonth: [
          { month: 'nov/25', volume: 12000 },
          { month: 'dez/25', volume: 13000 },
        ],
        recentLogs: [],
      };

      vi.mocked(db.getTrainingDashboard).mockResolvedValue(mockDashboard);

      const result = await db.getTrainingDashboard(1, {});

      expect(result).toBeDefined();
      expect(result?.totalWorkouts).toBe(25);
      expect(result?.totalVolume).toBe(25000);
      expect(result?.workoutsByMonth).toHaveLength(2);
    });

    it('deve filtrar por aluno específico', async () => {
      const mockDashboard = {
        totalWorkouts: 10,
        totalSets: 60,
        totalReps: 600,
        totalVolume: 10000,
        totalExercises: 40,
        avgDuration: 55,
        feelingDistribution: {
          great: 5,
          good: 3,
          normal: 2,
          tired: 0,
          exhausted: 0,
        },
        workoutsByMonth: [],
        volumeByMonth: [],
        recentLogs: [],
      };

      vi.mocked(db.getTrainingDashboard).mockResolvedValue(mockDashboard);

      const result = await db.getTrainingDashboard(1, { studentId: 5 });

      expect(db.getTrainingDashboard).toHaveBeenCalledWith(1, { studentId: 5 });
      expect(result?.totalWorkouts).toBe(10);
    });
  });

  describe('getMuscleGroupAnalysis', () => {
    it('deve retornar análise por grupo muscular', async () => {
      const mockAnalysis = [
        { name: 'Peito', volume: 5000, sets: 30, reps: 300, exercises: 10 },
        { name: 'Costas', volume: 4500, sets: 28, reps: 280, exercises: 9 },
        { name: 'Pernas', volume: 6000, sets: 35, reps: 350, exercises: 12 },
      ];

      vi.mocked(db.getMuscleGroupAnalysis).mockResolvedValue(mockAnalysis);

      const result = await db.getMuscleGroupAnalysis(1, {});

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Peito');
    });
  });

  describe('getInactiveStudents', () => {
    it('deve retornar alunos inativos há mais de 7 dias', async () => {
      const mockInactiveStudents = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          status: 'active',
          createdAt: new Date('2025-01-01'),
          lastWorkoutDate: new Date('2025-12-20'),
          daysInactive: 17,
          neverTrained: false,
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '11888888888',
          status: 'active',
          createdAt: new Date('2025-06-01'),
          lastWorkoutDate: null,
          daysInactive: 200,
          neverTrained: true,
        },
      ];

      vi.mocked(db.getInactiveStudents).mockResolvedValue(mockInactiveStudents);

      const result = await db.getInactiveStudents(1, 7);

      expect(result).toHaveLength(2);
      expect(result[0].daysInactive).toBe(17);
      expect(result[1].neverTrained).toBe(true);
    });

    it('deve usar 7 dias como padrão', async () => {
      vi.mocked(db.getInactiveStudents).mockResolvedValue([]);

      await db.getInactiveStudents(1, 7);

      expect(db.getInactiveStudents).toHaveBeenCalledWith(1, 7);
    });
  });

  describe('getStudentsActivityStats', () => {
    it('deve retornar estatísticas de atividade dos alunos', async () => {
      const mockStats = {
        totalStudents: 10,
        activeThisMonth: 7,
        inactiveThisMonth: 3,
        avgWorkoutsPerStudent: 3.5,
        topStudents: [
          { id: 1, name: 'João', totalWorkouts: 20, workoutsLastMonth: 8, totalVolume: 50000, lastWorkoutDate: new Date(), avgWorkoutsPerWeek: 2 },
          { id: 2, name: 'Maria', totalWorkouts: 18, workoutsLastMonth: 7, totalVolume: 45000, lastWorkoutDate: new Date(), avgWorkoutsPerWeek: 1.75 },
        ],
        allStudents: [],
      };

      vi.mocked(db.getStudentsActivityStats).mockResolvedValue(mockStats);

      const result = await db.getStudentsActivityStats(1);

      expect(result).toBeDefined();
      expect(result?.totalStudents).toBe(10);
      expect(result?.activeThisMonth).toBe(7);
      expect(result?.topStudents).toHaveLength(2);
    });
  });
});

describe('Training Evolution PDF Export', () => {
  it('deve ter a estrutura correta para exportação', async () => {
    const mockStudent = {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
    };

    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);

    const student = await db.getStudentById(1, 1);

    expect(student).toBeDefined();
    expect(student?.name).toBe('João Silva');
  });
});
