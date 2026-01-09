import { describe, it, expect } from 'vitest';

// Função auxiliar para normalizar nomes de exercícios (cópia para teste)
function normalizeExerciseNameHelper(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Substituir múltiplos espaços por um só
    .replace(/\u00b0/g, '°') // Padronizar símbolo de grau
    .replace(/\u00ba/g, '°') // Substituir ordinal masculino por grau
    .replace(/\u00aa/g, '°'); // Substituir ordinal feminino por grau
}

describe('Exercise Name Normalization', () => {
  it('should trim whitespace from exercise names', () => {
    expect(normalizeExerciseNameHelper('  Leg Press 45°  ')).toBe('Leg Press 45°');
  });

  it('should replace multiple spaces with single space', () => {
    expect(normalizeExerciseNameHelper('Leg  Press   45°')).toBe('Leg Press 45°');
  });

  it('should normalize degree symbols', () => {
    // Ordinal masculino (º) deve virar grau (°)
    expect(normalizeExerciseNameHelper('Leg Press 45º')).toBe('Leg Press 45°');
    // Ordinal feminino (ª) deve virar grau (°)
    expect(normalizeExerciseNameHelper('Leg Press 45ª')).toBe('Leg Press 45°');
  });

  it('should handle exercise names with different degree symbols as same', () => {
    const name1 = normalizeExerciseNameHelper('Leg Press 45°').toLowerCase();
    const name2 = normalizeExerciseNameHelper('Leg Press 45º').toLowerCase();
    const name3 = normalizeExerciseNameHelper('Leg Press 45ª').toLowerCase();
    
    expect(name1).toBe(name2);
    expect(name2).toBe(name3);
  });

  it('should handle exercise names with extra spaces as same', () => {
    const name1 = normalizeExerciseNameHelper('Leg Press 45°').toLowerCase();
    const name2 = normalizeExerciseNameHelper('Leg  Press  45°').toLowerCase();
    const name3 = normalizeExerciseNameHelper('  Leg Press 45°  ').toLowerCase();
    
    expect(name1).toBe(name2);
    expect(name2).toBe(name3);
  });

  it('should deduplicate exercise list correctly', () => {
    const exercises = [
      'Leg Press 45°',
      'Leg Press 45º',
      'Leg  Press 45°',
      'Agachamento Livre',
      'Agachamento  Livre',
    ];
    
    // Simular a lógica de deduplicação
    const exerciseMap = new Map<string, string>();
    
    for (const ex of exercises) {
      const normalizedKey = normalizeExerciseNameHelper(ex).toLowerCase();
      if (!exerciseMap.has(normalizedKey)) {
        exerciseMap.set(normalizedKey, normalizeExerciseNameHelper(ex));
      }
    }
    
    const uniqueExercises = Array.from(exerciseMap.values());
    
    expect(uniqueExercises).toHaveLength(2);
    expect(uniqueExercises).toContain('Leg Press 45°');
    expect(uniqueExercises).toContain('Agachamento Livre');
  });
});
