import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock do db
vi.mock('./db', () => ({
  getStudentById: vi.fn(),
  getCardioStats: vi.fn(),
  getCardioEvolutionData: vi.fn(),
  getCardioLogsByStudent: vi.fn(),
  getPersonalByUserId: vi.fn(),
}));

// Mock do módulo de PDF
vi.mock('./pdf/cardioReport', () => ({
  generateCardioPDF: vi.fn(),
}));

import * as db from './db';
import { generateCardioPDF } from './pdf/cardioReport';

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe('cardio.exportPDF', () => {
  const mockUser: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockPersonal = {
    id: 1,
    userId: 1,
    businessName: 'FitPrime Test',
    logoUrl: null,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trialEndsAt: null,
    testAccessEndsAt: null,
    createdAt: new Date(),
  };

  const mockStudent = {
    id: 1,
    personalId: 1,
    name: 'João Silva',
    email: 'joao@test.com',
    phone: '11999999999',
  };

  const mockStats = {
    totalSessions: 10,
    totalDuration: 300,
    totalDistance: 25.5,
    totalCalories: 2500,
    avgHeartRate: 145,
    avgDuration: 30,
    avgDistance: 2.55,
    byType: {
      treadmill: { count: 5, duration: 150, distance: 12.5, calories: 1250 },
      outdoor_run: { count: 5, duration: 150, distance: 13, calories: 1250 },
    },
  };

  const mockEvolution = [
    { date: '2025-01-01', sessionCount: 2, totalDuration: 60, totalDistance: 5, totalCalories: 500, avgHeartRate: 140 },
    { date: '2025-01-02', sessionCount: 1, totalDuration: 30, totalDistance: 2.5, totalCalories: 250, avgHeartRate: 145 },
  ];

  const mockLogs = [
    {
      id: 1,
      cardioDate: new Date('2025-01-02'),
      cardioType: 'treadmill',
      durationMinutes: 30,
      distanceKm: '2.5',
      caloriesBurned: 250,
      avgHeartRate: 145,
    },
  ];

  const mockPDFBuffer = Buffer.from('mock pdf content');

  function createTestContext(): TrpcContext {
    return {
      user: mockUser,
      req: {
        protocol: 'https',
        headers: {},
      } as TrpcContext['req'],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext['res'],
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);
    vi.mocked(db.getCardioStats).mockResolvedValue(mockStats as any);
    vi.mocked(db.getCardioEvolutionData).mockResolvedValue(mockEvolution as any);
    vi.mocked(db.getCardioLogsByStudent).mockResolvedValue(mockLogs as any);
    vi.mocked(generateCardioPDF).mockResolvedValue(mockPDFBuffer);
  });

  it('deve exportar PDF de cardio com sucesso', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cardio.exportPDF({
      studentId: 1,
      period: 30,
      groupBy: 'day',
    });

    expect(result).toBeDefined();
    expect(result.filename).toContain('João_Silva');
    expect(result.filename).toContain('cardio');
    expect(result.filename).toContain('.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.data).toBeDefined();
    
    // Verificar que o PDF foi gerado com os parâmetros corretos
    expect(generateCardioPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'João Silva',
        email: 'joao@test.com',
        phone: '11999999999',
      }),
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.stringContaining('Último'),
      expect.objectContaining({
        businessName: 'FitPrime Test',
      })
    );
  });

  it('deve retornar erro se aluno não for encontrado', async () => {
    vi.mocked(db.getStudentById).mockResolvedValue(null);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.cardio.exportPDF({
        studentId: 999,
        period: 30,
      })
    ).rejects.toThrow('Aluno não encontrado');
  });

  it('deve usar período correto no label do PDF', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Testar período de 7 dias
    await caller.cardio.exportPDF({
      studentId: 1,
      period: 7,
    });

    expect(generateCardioPDF).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      'Últimos 7 dias',
      expect.any(Object)
    );

    vi.clearAllMocks();
    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);
    vi.mocked(db.getCardioStats).mockResolvedValue(mockStats as any);
    vi.mocked(db.getCardioEvolutionData).mockResolvedValue(mockEvolution as any);
    vi.mocked(db.getCardioLogsByStudent).mockResolvedValue(mockLogs as any);
    vi.mocked(generateCardioPDF).mockResolvedValue(mockPDFBuffer);

    // Testar período de 90 dias
    await caller.cardio.exportPDF({
      studentId: 1,
      period: 90,
    });

    expect(generateCardioPDF).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      'Últimos 3 meses',
      expect.any(Object)
    );
  });

  it('deve chamar as funções de banco de dados corretas', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.cardio.exportPDF({
      studentId: 1,
      period: 30,
      groupBy: 'week',
    });

    expect(db.getStudentById).toHaveBeenCalledWith(1, 1);
    expect(db.getCardioStats).toHaveBeenCalledWith(1, 1, 30);
    expect(db.getCardioEvolutionData).toHaveBeenCalledWith(
      1,
      1,
      expect.any(String),
      expect.any(String),
      'week'
    );
    expect(db.getCardioLogsByStudent).toHaveBeenCalledWith(1, 1, 50);
  });

  it('deve usar groupBy padrão "day" quando não especificado', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.cardio.exportPDF({
      studentId: 1,
      period: 30,
    });

    expect(db.getCardioEvolutionData).toHaveBeenCalledWith(
      1,
      1,
      expect.any(String),
      expect.any(String),
      'day'
    );
  });
});
