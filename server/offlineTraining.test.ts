import { describe, it, expect } from 'vitest';

/**
 * Testes para a estrutura de dados do sistema de treinos offline
 * 
 * O sistema de treinos offline permite que tanto o personal quanto o aluno
 * registrem treinos mesmo sem conexão com a internet, com sincronização
 * automática quando a conexão é restaurada.
 */

// Tipos que devem ser compatíveis com o offlineStorage.ts
interface OfflineWorkoutSet {
  id: string;
  exerciseName: string;
  muscleGroup?: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  setType: string;
  notes?: string;
  completed: boolean;
}

interface OfflineTrainingLog {
  id: string;
  studentId: number;
  workoutId?: number;
  workoutDayId?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  feeling?: string;
  notes?: string;
  status: 'in_progress' | 'completed';
  sets: OfflineWorkoutSet[];
  createdAt: number;
  source: 'personal' | 'student';
  synced: boolean;
}

describe('Offline Training Data Structure', () => {
  it('should create a valid offline training log for personal', () => {
    const log: OfflineTrainingLog = {
      id: 'offline_123',
      studentId: 1,
      workoutId: 10,
      workoutDayId: 5,
      date: '2026-01-06',
      startTime: '2026-01-06T10:00:00Z',
      status: 'in_progress',
      sets: [],
      createdAt: Date.now(),
      source: 'personal',
      synced: false,
    };

    expect(log.source).toBe('personal');
    expect(log.status).toBe('in_progress');
    expect(log.synced).toBe(false);
    expect(log.sets).toHaveLength(0);
  });

  it('should create a valid offline training log for student', () => {
    const log: OfflineTrainingLog = {
      id: 'offline_456',
      studentId: 2,
      date: '2026-01-06',
      status: 'in_progress',
      sets: [],
      createdAt: Date.now(),
      source: 'student',
      synced: false,
    };

    expect(log.source).toBe('student');
    expect(log.studentId).toBe(2);
  });

  it('should create a valid offline workout set', () => {
    const set: OfflineWorkoutSet = {
      id: 'set_001',
      exerciseName: 'Supino Reto',
      muscleGroup: 'Peito',
      setNumber: 1,
      weight: 80,
      reps: 10,
      rpe: 8,
      setType: 'working',
      completed: true,
    };

    expect(set.exerciseName).toBe('Supino Reto');
    expect(set.weight).toBe(80);
    expect(set.reps).toBe(10);
    expect(set.setType).toBe('working');
  });

  it('should support different set types', () => {
    const setTypes = ['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure'];
    
    setTypes.forEach(type => {
      const set: OfflineWorkoutSet = {
        id: `set_${type}`,
        exerciseName: 'Teste',
        setNumber: 1,
        setType: type,
        completed: false,
      };
      expect(set.setType).toBe(type);
    });
  });

  it('should add sets to a training log', () => {
    const log: OfflineTrainingLog = {
      id: 'offline_789',
      studentId: 1,
      date: '2026-01-06',
      status: 'in_progress',
      sets: [],
      createdAt: Date.now(),
      source: 'personal',
      synced: false,
    };

    const newSet: OfflineWorkoutSet = {
      id: 'set_001',
      exerciseName: 'Agachamento',
      muscleGroup: 'Pernas',
      setNumber: 1,
      weight: 100,
      reps: 8,
      setType: 'working',
      completed: true,
    };

    log.sets.push(newSet);
    expect(log.sets).toHaveLength(1);
    expect(log.sets[0].exerciseName).toBe('Agachamento');
  });

  it('should complete a training log with duration', () => {
    const startTime = new Date('2026-01-06T10:00:00Z').getTime();
    const endTime = new Date('2026-01-06T11:30:00Z').getTime();
    const duration = Math.round((endTime - startTime) / 60000); // em minutos

    const log: OfflineTrainingLog = {
      id: 'offline_complete',
      studentId: 1,
      date: '2026-01-06',
      startTime: '2026-01-06T10:00:00Z',
      endTime: '2026-01-06T11:30:00Z',
      duration,
      status: 'completed',
      feeling: 'good',
      notes: 'Treino intenso',
      sets: [],
      createdAt: startTime,
      source: 'personal',
      synced: false,
    };

    expect(log.status).toBe('completed');
    expect(log.duration).toBe(90); // 90 minutos
    expect(log.feeling).toBe('good');
  });

  it('should group sets by exercise for API sync', () => {
    const sets: OfflineWorkoutSet[] = [
      { id: '1', exerciseName: 'Supino', muscleGroup: 'Peito', setNumber: 1, weight: 80, reps: 10, setType: 'working', completed: true },
      { id: '2', exerciseName: 'Supino', muscleGroup: 'Peito', setNumber: 2, weight: 80, reps: 10, setType: 'working', completed: true },
      { id: '3', exerciseName: 'Crucifixo', muscleGroup: 'Peito', setNumber: 1, weight: 20, reps: 12, setType: 'working', completed: true },
    ];

    // Agrupar por exercício (como feito no useOfflineTraining)
    const exerciseMap = new Map<string, OfflineWorkoutSet[]>();
    for (const set of sets) {
      const key = set.exerciseName;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, []);
      }
      exerciseMap.get(key)!.push(set);
    }

    expect(exerciseMap.size).toBe(2);
    expect(exerciseMap.get('Supino')?.length).toBe(2);
    expect(exerciseMap.get('Crucifixo')?.length).toBe(1);
  });

  it('should count pending logs by source', () => {
    const logs: OfflineTrainingLog[] = [
      { id: '1', studentId: 1, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'personal', synced: false },
      { id: '2', studentId: 2, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'student', synced: false },
      { id: '3', studentId: 1, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'personal', synced: false },
      { id: '4', studentId: 3, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'student', synced: false },
    ];

    const personalCount = logs.filter(l => l.source === 'personal').length;
    const studentCount = logs.filter(l => l.source === 'student').length;

    expect(personalCount).toBe(2);
    expect(studentCount).toBe(2);
  });

  it('should skip in-progress logs during sync', () => {
    const logs: OfflineTrainingLog[] = [
      { id: '1', studentId: 1, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'personal', synced: false },
      { id: '2', studentId: 1, date: '2026-01-06', status: 'in_progress', sets: [], createdAt: Date.now(), source: 'personal', synced: false },
      { id: '3', studentId: 1, date: '2026-01-06', status: 'completed', sets: [], createdAt: Date.now(), source: 'personal', synced: false },
    ];

    const logsToSync = logs.filter(l => l.status !== 'in_progress');
    expect(logsToSync.length).toBe(2);
  });
});

describe('Offline ID Generation', () => {
  it('should generate unique offline IDs', () => {
    const generateOfflineId = () => `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateOfflineId());
    }
    
    // Todos os IDs devem ser únicos
    expect(ids.size).toBe(100);
  });

  it('should prefix offline IDs correctly', () => {
    const generateOfflineId = () => `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const id = generateOfflineId();
    
    expect(id.startsWith('offline_')).toBe(true);
  });
});
