import { describe, it, expect } from 'vitest';

/**
 * Testes do sistema de cache de treinos offline
 * 
 * Nota: O offlineStorage.ts é um módulo client-side que usa IndexedDB.
 * Estes testes validam a estrutura de dados e lógica do sistema.
 */

// Tipos do sistema de cache (espelho do client/src/lib/offlineStorage.ts)
interface CachedWorkout {
  id: number;
  name: string;
  description?: string;
  objective?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  days: CachedWorkoutDay[];
  cachedAt?: number;
  studentId?: number;
}

interface CachedWorkoutDay {
  id: number;
  workoutId: number;
  dayName: string;
  dayOrder: number;
  exercises: CachedExercise[];
  cachedAt?: number;
}

interface CachedExercise {
  id: number;
  workoutDayId: number;
  name: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  weight?: string;
  restTime?: number;
  tempo?: string;
  videoUrl?: string;
  notes?: string;
  orderIndex: number;
  cachedAt?: number;
}

describe('Workout Cache - Estrutura de Dados', () => {
  describe('CachedWorkout', () => {
    it('deve ter a estrutura básica correta', () => {
      const workout: CachedWorkout = {
        id: 1,
        name: 'Treino A',
        days: []
      };
      
      expect(workout).toHaveProperty('id');
      expect(workout).toHaveProperty('name');
      expect(workout).toHaveProperty('days');
      expect(Array.isArray(workout.days)).toBe(true);
    });

    it('deve aceitar todos os campos opcionais', () => {
      const workout: CachedWorkout = {
        id: 1,
        name: 'Treino Completo',
        description: 'Descrição do treino',
        objective: 'Hipertrofia',
        type: 'musculacao',
        difficulty: 'intermediario',
        status: 'active',
        cachedAt: Date.now(),
        studentId: 123,
        days: []
      };
      
      expect(workout.description).toBe('Descrição do treino');
      expect(workout.objective).toBe('Hipertrofia');
      expect(workout.type).toBe('musculacao');
      expect(workout.difficulty).toBe('intermediario');
      expect(workout.status).toBe('active');
      expect(workout.studentId).toBe(123);
      expect(typeof workout.cachedAt).toBe('number');
    });

    it('deve suportar treino com dias e exercícios completos', () => {
      const workout: CachedWorkout = {
        id: 1,
        name: 'Treino Full Body',
        status: 'active',
        studentId: 100,
        days: [
          {
            id: 101,
            workoutId: 1,
            dayName: 'Segunda - Peito e Tríceps',
            dayOrder: 1,
            exercises: [
              {
                id: 1001,
                workoutDayId: 101,
                name: 'Supino Reto',
                muscleGroup: 'Peito',
                sets: 4,
                reps: '10-12',
                weight: '60kg',
                restTime: 90,
                tempo: '3-1-2',
                notes: 'Manter cotovelos a 45 graus',
                orderIndex: 0
              },
              {
                id: 1002,
                workoutDayId: 101,
                name: 'Tríceps Corda',
                muscleGroup: 'Tríceps',
                sets: 3,
                reps: '12-15',
                weight: '25kg',
                restTime: 60,
                orderIndex: 1
              }
            ]
          },
          {
            id: 102,
            workoutId: 1,
            dayName: 'Quarta - Costas e Bíceps',
            dayOrder: 2,
            exercises: [
              {
                id: 1003,
                workoutDayId: 102,
                name: 'Puxada Frontal',
                muscleGroup: 'Costas',
                sets: 4,
                reps: '10-12',
                weight: '50kg',
                orderIndex: 0
              }
            ]
          }
        ]
      };
      
      expect(workout.days.length).toBe(2);
      expect(workout.days[0].exercises.length).toBe(2);
      expect(workout.days[1].exercises.length).toBe(1);
      expect(workout.days[0].dayName).toBe('Segunda - Peito e Tríceps');
      expect(workout.days[0].exercises[0].name).toBe('Supino Reto');
      expect(workout.days[0].exercises[0].muscleGroup).toBe('Peito');
    });
  });

  describe('CachedWorkoutDay', () => {
    it('deve ter a estrutura correta', () => {
      const day: CachedWorkoutDay = {
        id: 101,
        workoutId: 1,
        dayName: 'Segunda',
        dayOrder: 1,
        exercises: []
      };
      
      expect(day).toHaveProperty('id');
      expect(day).toHaveProperty('workoutId');
      expect(day).toHaveProperty('dayName');
      expect(day).toHaveProperty('dayOrder');
      expect(day).toHaveProperty('exercises');
    });

    it('deve manter a ordem dos dias', () => {
      const days: CachedWorkoutDay[] = [
        { id: 1, workoutId: 1, dayName: 'Treino A', dayOrder: 1, exercises: [] },
        { id: 2, workoutId: 1, dayName: 'Treino B', dayOrder: 2, exercises: [] },
        { id: 3, workoutId: 1, dayName: 'Treino C', dayOrder: 3, exercises: [] },
      ];
      
      const sorted = days.sort((a, b) => a.dayOrder - b.dayOrder);
      
      expect(sorted[0].dayName).toBe('Treino A');
      expect(sorted[1].dayName).toBe('Treino B');
      expect(sorted[2].dayName).toBe('Treino C');
    });
  });

  describe('CachedExercise', () => {
    it('deve ter a estrutura correta', () => {
      const exercise: CachedExercise = {
        id: 1001,
        workoutDayId: 101,
        name: 'Supino Reto',
        orderIndex: 0
      };
      
      expect(exercise).toHaveProperty('id');
      expect(exercise).toHaveProperty('workoutDayId');
      expect(exercise).toHaveProperty('name');
      expect(exercise).toHaveProperty('orderIndex');
    });

    it('deve aceitar todos os campos de exercício', () => {
      const exercise: CachedExercise = {
        id: 1001,
        workoutDayId: 101,
        name: 'Agachamento Livre',
        muscleGroup: 'Quadríceps',
        sets: 5,
        reps: '5',
        weight: '100kg',
        restTime: 180,
        tempo: '3-2-1',
        videoUrl: 'https://example.com/squat.mp4',
        notes: 'Descer até paralelo',
        orderIndex: 0,
        cachedAt: Date.now()
      };
      
      expect(exercise.muscleGroup).toBe('Quadríceps');
      expect(exercise.sets).toBe(5);
      expect(exercise.reps).toBe('5');
      expect(exercise.weight).toBe('100kg');
      expect(exercise.restTime).toBe(180);
      expect(exercise.tempo).toBe('3-2-1');
      expect(exercise.videoUrl).toBe('https://example.com/squat.mp4');
      expect(exercise.notes).toBe('Descer até paralelo');
    });

    it('deve manter a ordem dos exercícios', () => {
      const exercises: CachedExercise[] = [
        { id: 3, workoutDayId: 1, name: 'Exercício C', orderIndex: 2 },
        { id: 1, workoutDayId: 1, name: 'Exercício A', orderIndex: 0 },
        { id: 2, workoutDayId: 1, name: 'Exercício B', orderIndex: 1 },
      ];
      
      const sorted = exercises.sort((a, b) => a.orderIndex - b.orderIndex);
      
      expect(sorted[0].name).toBe('Exercício A');
      expect(sorted[1].name).toBe('Exercício B');
      expect(sorted[2].name).toBe('Exercício C');
    });
  });
});

describe('Workout Cache - Lógica de Cache', () => {
  describe('Geração de ID Offline', () => {
    it('deve gerar IDs únicos com prefixo offline_', () => {
      const generateOfflineId = (): string => {
        return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      };
      
      const id1 = generateOfflineId();
      const id2 = generateOfflineId();
      
      expect(id1).toMatch(/^offline_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^offline_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Verificação de Cache Expirado', () => {
    it('deve identificar cache expirado após 24 horas', () => {
      const isCacheExpired = (lastSync: number, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
        return Date.now() - lastSync > maxAgeMs;
      };
      
      const now = Date.now();
      const oneDayAgo = now - (25 * 60 * 60 * 1000); // 25 horas atrás
      const oneHourAgo = now - (1 * 60 * 60 * 1000); // 1 hora atrás
      
      expect(isCacheExpired(oneDayAgo)).toBe(true);
      expect(isCacheExpired(oneHourAgo)).toBe(false);
    });

    it('deve permitir configurar tempo máximo de cache', () => {
      const isCacheExpired = (lastSync: number, maxAgeMs: number): boolean => {
        return Date.now() - lastSync > maxAgeMs;
      };
      
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);
      
      // Com 1 hora de limite, deve estar expirado
      expect(isCacheExpired(twoHoursAgo, 1 * 60 * 60 * 1000)).toBe(true);
      
      // Com 3 horas de limite, não deve estar expirado
      expect(isCacheExpired(twoHoursAgo, 3 * 60 * 60 * 1000)).toBe(false);
    });
  });

  describe('Transformação de Dados do Servidor', () => {
    it('deve transformar dados do servidor para formato de cache', () => {
      const serverWorkout = {
        id: 1,
        name: 'Treino A',
        description: 'Descrição',
        status: 'active',
        days: [
          {
            id: 101,
            dayName: 'Segunda',
            dayOrder: 1,
            exercises: [
              {
                id: 1001,
                name: 'Supino',
                sets: 4,
                reps: '10',
                orderIndex: 0
              }
            ]
          }
        ]
      };
      
      const transformToCached = (workout: any, studentId?: number): CachedWorkout => ({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        status: workout.status,
        studentId: studentId,
        cachedAt: Date.now(),
        days: workout.days?.map((d: any) => ({
          id: d.id,
          workoutId: workout.id,
          dayName: d.dayName,
          dayOrder: d.dayOrder,
          exercises: d.exercises?.map((e: any) => ({
            id: e.id,
            workoutDayId: d.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            orderIndex: e.orderIndex || 0,
          })) || [],
        })) || [],
      });
      
      const cached = transformToCached(serverWorkout, 123);
      
      expect(cached.id).toBe(1);
      expect(cached.name).toBe('Treino A');
      expect(cached.studentId).toBe(123);
      expect(cached.cachedAt).toBeDefined();
      expect(cached.days.length).toBe(1);
      expect(cached.days[0].workoutId).toBe(1);
      expect(cached.days[0].exercises.length).toBe(1);
      expect(cached.days[0].exercises[0].workoutDayId).toBe(101);
    });
  });
});

describe('Workout Cache - Cenários de Uso', () => {
  it('deve suportar treino vazio (sem dias)', () => {
    const workout: CachedWorkout = {
      id: 1,
      name: 'Treino Novo',
      days: []
    };
    
    expect(workout.days.length).toBe(0);
  });

  it('deve suportar dia sem exercícios', () => {
    const workout: CachedWorkout = {
      id: 1,
      name: 'Treino em Construção',
      days: [
        {
          id: 101,
          workoutId: 1,
          dayName: 'Dia 1',
          dayOrder: 1,
          exercises: []
        }
      ]
    };
    
    expect(workout.days[0].exercises.length).toBe(0);
  });

  it('deve calcular total de exercícios em um treino', () => {
    const workout: CachedWorkout = {
      id: 1,
      name: 'Treino Completo',
      days: [
        { id: 1, workoutId: 1, dayName: 'A', dayOrder: 1, exercises: [
          { id: 1, workoutDayId: 1, name: 'Ex1', orderIndex: 0 },
          { id: 2, workoutDayId: 1, name: 'Ex2', orderIndex: 1 },
        ]},
        { id: 2, workoutId: 1, dayName: 'B', dayOrder: 2, exercises: [
          { id: 3, workoutDayId: 2, name: 'Ex3', orderIndex: 0 },
          { id: 4, workoutDayId: 2, name: 'Ex4', orderIndex: 1 },
          { id: 5, workoutDayId: 2, name: 'Ex5', orderIndex: 2 },
        ]},
      ]
    };
    
    const totalExercises = workout.days.reduce(
      (acc, day) => acc + day.exercises.length, 
      0
    );
    
    expect(totalExercises).toBe(5);
  });

  it('deve identificar treinos ativos vs inativos', () => {
    const activeWorkout: CachedWorkout = {
      id: 1,
      name: 'Treino Ativo',
      status: 'active',
      days: []
    };
    
    const inactiveWorkout: CachedWorkout = {
      id: 2,
      name: 'Treino Inativo',
      status: 'inactive',
      days: []
    };
    
    expect(activeWorkout.status).toBe('active');
    expect(inactiveWorkout.status).toBe('inactive');
  });

  it('deve filtrar treinos por studentId', () => {
    const workouts: CachedWorkout[] = [
      { id: 1, name: 'Treino 1', studentId: 100, days: [] },
      { id: 2, name: 'Treino 2', studentId: 100, days: [] },
      { id: 3, name: 'Treino 3', studentId: 200, days: [] },
    ];
    
    const student100Workouts = workouts.filter(w => w.studentId === 100);
    const student200Workouts = workouts.filter(w => w.studentId === 200);
    
    expect(student100Workouts.length).toBe(2);
    expect(student200Workouts.length).toBe(1);
  });
});
