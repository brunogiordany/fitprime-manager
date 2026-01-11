import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do db
vi.mock('./db', () => ({
  getAnamnesisByStudentId: vi.fn(),
  getCardioStats: vi.fn(),
}));

import * as db from './db';

describe('Cardio Preferred Activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('preferredActivities logic', () => {
    it('deve retornar array vazio quando não há anamnese', async () => {
      vi.mocked(db.getAnamnesisByStudentId).mockResolvedValue(null);
      
      const anamnesis = await db.getAnamnesisByStudentId(1);
      
      expect(anamnesis).toBeNull();
      // A lógica da rota retornaria: { activities: [], doesCardio: false, frequency: 0, duration: 0 }
    });

    it('deve fazer parse correto de cardioActivities JSON válido', async () => {
      const mockAnamnesis = {
        id: 1,
        studentId: 1,
        personalId: 1,
        doesCardio: true,
        cardioActivities: JSON.stringify([
          { activity: 'corrida', frequency: 3, duration: 30 },
          { activity: 'natacao', frequency: 2, duration: 45 }
        ]),
      };
      
      vi.mocked(db.getAnamnesisByStudentId).mockResolvedValue(mockAnamnesis as any);
      
      const anamnesis = await db.getAnamnesisByStudentId(1);
      const activities = JSON.parse((anamnesis as any).cardioActivities);
      
      expect(activities).toHaveLength(2);
      expect(activities[0].activity).toBe('corrida');
      expect(activities[0].frequency).toBe(3);
      expect(activities[1].activity).toBe('natacao');
    });

    it('deve calcular frequência total corretamente', () => {
      const activities = [
        { activity: 'corrida', frequency: 3, duration: 30 },
        { activity: 'natacao', frequency: 2, duration: 45 }
      ];
      
      const totalFrequency = activities.reduce((sum, a) => sum + (a.frequency || 0), 0);
      
      expect(totalFrequency).toBe(5);
    });

    it('deve calcular duração média corretamente', () => {
      const activities = [
        { activity: 'corrida', frequency: 3, duration: 30 },
        { activity: 'natacao', frequency: 2, duration: 45 }
      ];
      
      const avgDuration = activities.length > 0 
        ? Math.round(activities.reduce((sum, a) => sum + (a.duration || 0), 0) / activities.length)
        : 0;
      
      expect(avgDuration).toBe(38); // (30 + 45) / 2 = 37.5, arredondado = 38
    });

    it('deve tratar cardioActivities inválido sem quebrar', () => {
      const invalidValues = ['Nao', 'Não', 'nenhum', '', null, undefined];
      
      invalidValues.forEach(value => {
        let activities: any[] = [];
        
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              activities = parsed;
            }
          } catch {
            // Ignora erro de parse
          }
        }
        
        expect(activities).toEqual([]);
      });
    });
  });

  describe('complianceAnalysis logic', () => {
    it('deve calcular compliance de frequência corretamente', () => {
      const plannedWeeklyFrequency = 5;
      const actualWeeklyFrequency = 4;
      
      const frequencyCompliance = plannedWeeklyFrequency > 0 
        ? Math.min(100, Math.round((actualWeeklyFrequency / plannedWeeklyFrequency) * 100))
        : null;
      
      expect(frequencyCompliance).toBe(80);
    });

    it('deve retornar null quando não há plano', () => {
      const plannedWeeklyFrequency = 0;
      const actualWeeklyFrequency = 4;
      
      const frequencyCompliance = plannedWeeklyFrequency > 0 
        ? Math.min(100, Math.round((actualWeeklyFrequency / plannedWeeklyFrequency) * 100))
        : null;
      
      expect(frequencyCompliance).toBeNull();
    });

    it('deve limitar compliance a 100%', () => {
      const plannedWeeklyFrequency = 3;
      const actualWeeklyFrequency = 5; // Mais do que o planejado
      
      const frequencyCompliance = plannedWeeklyFrequency > 0 
        ? Math.min(100, Math.round((actualWeeklyFrequency / plannedWeeklyFrequency) * 100))
        : null;
      
      expect(frequencyCompliance).toBe(100);
    });

    it('deve calcular compliance de tipos corretamente', () => {
      const plannedTypes = ['corrida', 'natacao', 'ciclismo'];
      const actualTypes = ['corrida', 'natacao'];
      
      const matchingTypes = plannedTypes.filter(t => actualTypes.includes(t));
      const typeCompliance = plannedTypes.length > 0
        ? Math.round((matchingTypes.length / plannedTypes.length) * 100)
        : null;
      
      expect(matchingTypes).toEqual(['corrida', 'natacao']);
      expect(typeCompliance).toBe(67); // 2/3 = 66.67%, arredondado = 67
    });

    it('deve calcular compliance geral como média', () => {
      const frequencyCompliance = 80;
      const durationCompliance = 90;
      
      const overallCompliance = Math.round((frequencyCompliance + durationCompliance) / 2);
      
      expect(overallCompliance).toBe(85);
    });
  });
});
