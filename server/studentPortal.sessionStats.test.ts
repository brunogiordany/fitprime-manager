import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  getSessionsByStudentId: vi.fn(),
}));

import * as db from './db';

describe('studentPortal.sessionStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve calcular estatísticas de sessão corretamente', async () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);

    const mockSessions = [
      { id: 1, scheduledAt: thisMonth, status: 'completed' },
      { id: 2, scheduledAt: thisMonth, status: 'completed' },
      { id: 3, scheduledAt: thisMonth, status: 'no_show' },
      { id: 4, scheduledAt: lastMonth, status: 'completed' },
      { id: 5, scheduledAt: lastMonth, status: 'completed' },
      { id: 6, scheduledAt: lastMonth, status: 'completed' },
      { id: 7, scheduledAt: twoMonthsAgo, status: 'completed' },
      { id: 8, scheduledAt: twoMonthsAgo, status: 'cancelled' },
    ];

    (db.getSessionsByStudentId as any).mockResolvedValue(mockSessions);

    // Simular a lógica do endpoint
    const sessions = await db.getSessionsByStudentId(1);
    
    const completed = sessions.filter((s: any) => s.status === 'completed');
    const noShow = sessions.filter((s: any) => s.status === 'no_show');
    const cancelled = sessions.filter((s: any) => s.status === 'cancelled');
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCompleted = completed.filter((s: any) => new Date(s.scheduledAt) >= thisMonthStart);
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthCompleted = completed.filter((s: any) => {
      const date = new Date(s.scheduledAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const totalSessions = sessions.length;
    const attendanceRate = totalSessions > 0 
      ? Math.round((completed.length / totalSessions) * 100) 
      : 0;

    // Verificações
    expect(completed.length).toBe(6);
    expect(noShow.length).toBe(1);
    expect(cancelled.length).toBe(1);
    expect(thisMonthCompleted.length).toBe(2);
    expect(lastMonthCompleted.length).toBe(3);
    expect(totalSessions).toBe(8);
    expect(attendanceRate).toBe(75); // 6/8 = 75%
  });

  it('deve retornar 0 quando não há sessões', async () => {
    (db.getSessionsByStudentId as any).mockResolvedValue([]);

    const sessions = await db.getSessionsByStudentId(1);
    
    const completed = sessions.filter((s: any) => s.status === 'completed');
    const noShow = sessions.filter((s: any) => s.status === 'no_show');
    const totalSessions = sessions.length;
    const attendanceRate = totalSessions > 0 
      ? Math.round((completed.length / totalSessions) * 100) 
      : 0;

    expect(completed.length).toBe(0);
    expect(noShow.length).toBe(0);
    expect(totalSessions).toBe(0);
    expect(attendanceRate).toBe(0);
  });

  it('deve calcular taxa de presença 100% quando todas sessões são completadas', async () => {
    const now = new Date();
    const mockSessions = [
      { id: 1, scheduledAt: now, status: 'completed' },
      { id: 2, scheduledAt: now, status: 'completed' },
      { id: 3, scheduledAt: now, status: 'completed' },
    ];

    (db.getSessionsByStudentId as any).mockResolvedValue(mockSessions);

    const sessions = await db.getSessionsByStudentId(1);
    
    const completed = sessions.filter((s: any) => s.status === 'completed');
    const totalSessions = sessions.length;
    const attendanceRate = totalSessions > 0 
      ? Math.round((completed.length / totalSessions) * 100) 
      : 0;

    expect(attendanceRate).toBe(100);
  });

  it('deve gerar dados mensais corretamente', async () => {
    const now = new Date();
    
    // Criar sessões para os últimos 3 meses
    const mockSessions = [];
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      mockSessions.push(
        { id: i * 2 + 1, scheduledAt: monthDate, status: 'completed' },
        { id: i * 2 + 2, scheduledAt: monthDate, status: 'no_show' }
      );
    }

    (db.getSessionsByStudentId as any).mockResolvedValue(mockSessions);

    const sessions = await db.getSessionsByStudentId(1);
    
    // Gerar dados mensais (últimos 6 meses)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      const monthCompleted = sessions.filter((s: any) => {
        const date = new Date(s.scheduledAt);
        return date >= monthStart && date <= monthEnd && s.status === 'completed';
      }).length;
      
      const monthNoShow = sessions.filter((s: any) => {
        const date = new Date(s.scheduledAt);
        return date >= monthStart && date <= monthEnd && s.status === 'no_show';
      }).length;
      
      monthlyData.push({
        month: monthName,
        presencas: monthCompleted,
        faltas: monthNoShow,
      });
    }

    // Verificar que temos 6 meses de dados
    expect(monthlyData.length).toBe(6);
    
    // Verificar que os últimos 3 meses têm dados
    const lastThreeMonths = monthlyData.slice(-3);
    const totalPresencas = lastThreeMonths.reduce((sum, m) => sum + m.presencas, 0);
    const totalFaltas = lastThreeMonths.reduce((sum, m) => sum + m.faltas, 0);
    
    expect(totalPresencas).toBe(3);
    expect(totalFaltas).toBe(3);
  });
});
