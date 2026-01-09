import { describe, it, expect, vi } from 'vitest';
import { generateWorkoutPDF } from './workoutReport';

describe('Workout PDF Report', () => {
  it('deve gerar PDF com dados básicos do aluno', async () => {
    const studentData = {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      birthDate: '1990-01-15',
      gender: 'male',
    };

    const measurementData = {
      weight: '80',
      height: '175',
      bodyFat: '18',
    };

    const anamnesisData = {
      mainGoal: 'hypertrophy',
      targetWeight: '85',
      lifestyle: 'active',
      weeklyFrequency: 4,
      sessionDuration: 60,
      doesCardio: true,
    };

    const workoutData = {
      name: 'Treino Hipertrofia',
      description: 'Treino focado em ganho de massa muscular',
      type: 'strength',
      difficulty: 'intermediate',
      days: [
        {
          dayName: 'Treino A - Peito e Tríceps',
          exercises: [
            {
              name: 'Supino Reto',
              muscleGroup: 'Peito',
              sets: 4,
              reps: '8-12',
              weight: '60kg',
              restTime: 90,
              notes: 'Manter cotovelos a 45 graus',
            },
            {
              name: 'Tríceps Pulley',
              muscleGroup: 'Tríceps',
              sets: 3,
              reps: '10-12',
              weight: '25kg',
              restTime: 60,
              notes: null,
            },
          ],
        },
      ],
    };

    const personalInfo = {
      businessName: 'FitPrime Personal',
      logoUrl: null,
    };

    const pdfBuffer = await generateWorkoutPDF(
      studentData,
      measurementData,
      anamnesisData,
      workoutData,
      personalInfo
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    // PDF começa com %PDF
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('deve gerar PDF mesmo sem dados de medidas', async () => {
    const studentData = {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '11888888888',
      birthDate: null,
      gender: 'female',
    };

    const workoutData = {
      name: 'Treino Básico',
      description: 'Treino para iniciantes',
      type: 'mixed',
      difficulty: 'beginner',
      days: [
        {
          dayName: 'Treino Full Body',
          exercises: [
            {
              name: 'Agachamento Livre',
              muscleGroup: 'Pernas',
              sets: 3,
              reps: '12-15',
              weight: null,
              restTime: 60,
              notes: null,
            },
          ],
        },
      ],
    };

    const personalInfo = {
      businessName: null,
      logoUrl: null,
    };

    const pdfBuffer = await generateWorkoutPDF(
      studentData,
      null, // sem medidas
      null, // sem anamnese
      workoutData,
      personalInfo
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('deve gerar PDF com múltiplos dias de treino', async () => {
    const studentData = {
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      phone: '11777777777',
      birthDate: '1985-06-20',
      gender: 'male',
    };

    const workoutData = {
      name: 'Treino ABC',
      description: 'Divisão em 3 dias',
      type: 'strength',
      difficulty: 'advanced',
      days: [
        {
          dayName: 'Treino A - Peito',
          exercises: [
            { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: '8-10', weight: '80kg', restTime: 90, notes: null },
            { name: 'Supino Inclinado', muscleGroup: 'Peito', sets: 4, reps: '8-10', weight: '60kg', restTime: 90, notes: null },
          ],
        },
        {
          dayName: 'Treino B - Costas',
          exercises: [
            { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 4, reps: '10-12', weight: '70kg', restTime: 90, notes: null },
            { name: 'Remada Curvada', muscleGroup: 'Costas', sets: 4, reps: '8-10', weight: '60kg', restTime: 90, notes: null },
          ],
        },
        {
          dayName: 'Treino C - Pernas',
          exercises: [
            { name: 'Agachamento', muscleGroup: 'Pernas', sets: 4, reps: '8-10', weight: '100kg', restTime: 120, notes: null },
            { name: 'Leg Press', muscleGroup: 'Pernas', sets: 4, reps: '10-12', weight: '200kg', restTime: 90, notes: null },
          ],
        },
      ],
    };

    const personalInfo = {
      businessName: 'Academia Força Total',
      logoUrl: null,
    };

    const pdfBuffer = await generateWorkoutPDF(
      studentData,
      null,
      null,
      workoutData,
      personalInfo
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
