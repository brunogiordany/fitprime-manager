import { describe, it, expect } from 'vitest';
import { allWorkoutTemplates, goalLabels, levelLabels } from '../shared/workout-templates';

describe('Workout AI System', () => {
  describe('Workout Templates', () => {
    it('should have workout templates defined', () => {
      expect(allWorkoutTemplates).toBeDefined();
      expect(Array.isArray(allWorkoutTemplates)).toBe(true);
      expect(allWorkoutTemplates.length).toBeGreaterThan(0);
    });

    it('should have templates for different goals', () => {
      const goals = allWorkoutTemplates.map(t => t.goal);
      expect(goals).toContain('hypertrophy');
      expect(goals).toContain('weight_loss');
      expect(goals).toContain('recomposition');
    });

    it('should have templates for different difficulty levels', () => {
      const levels = allWorkoutTemplates.map(t => t.difficulty);
      expect(levels).toContain('beginner');
      expect(levels).toContain('intermediate');
    });

    it('should have valid template structure', () => {
      allWorkoutTemplates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.goal).toBeDefined();
        expect(template.difficulty).toBeDefined();
        expect(template.daysPerWeek).toBeGreaterThan(0);
        expect(Array.isArray(template.days)).toBe(true);
        expect(template.days.length).toBeGreaterThan(0);
        
        template.days.forEach(day => {
          expect(day.name).toBeDefined();
          expect(Array.isArray(day.exercises)).toBe(true);
          expect(day.exercises.length).toBeGreaterThan(0);
          
          day.exercises.forEach(exercise => {
            expect(exercise.name).toBeDefined();
            expect(exercise.muscleGroup).toBeDefined();
            expect(exercise.sets).toBeGreaterThan(0);
            expect(exercise.reps).toBeDefined();
            expect(exercise.restSeconds).toBeGreaterThanOrEqual(0);
          });
        });
      });
    });
  });

  describe('Goal Labels', () => {
    it('should have labels for all goals', () => {
      expect(goalLabels).toBeDefined();
      expect(goalLabels.hypertrophy).toBe('Hipertrofia');
      expect(goalLabels.weight_loss).toBe('Emagrecimento');
      expect(goalLabels.recomposition).toBe('Recomposição Corporal');
      expect(goalLabels.bulking).toBe('Bulking (Ganho de Massa)');
      expect(goalLabels.cutting).toBe('Cutting (Definição)');
    });
  });

  describe('Level Labels', () => {
    it('should have labels for all levels', () => {
      expect(levelLabels).toBeDefined();
      expect(levelLabels.beginner).toBe('Iniciante');
      expect(levelLabels.intermediate).toBe('Intermediário');
      expect(levelLabels.advanced).toBe('Avançado');
    });
  });

  describe('Template Coverage', () => {
    it('should have at least 5 different templates', () => {
      expect(allWorkoutTemplates.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique template IDs', () => {
      const ids = allWorkoutTemplates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have templates with exercises for major muscle groups', () => {
      const allExercises = allWorkoutTemplates.flatMap(t => 
        t.days.flatMap(d => d.exercises)
      );
      const muscleGroups = new Set(allExercises.map(e => e.muscleGroup));
      
      expect(muscleGroups.has('Peito')).toBe(true);
      expect(muscleGroups.has('Costas')).toBe(true);
      expect(muscleGroups.has('Pernas')).toBe(true);
    });
  });
});
