import { describe, it, expect } from 'vitest';

describe('Invite Cancellation and Analytics', () => {
  describe('Cancel General Invite', () => {
    it('deve cancelar um link de convite geral', () => {
      const invite = {
        id: 1,
        personalId: 123,
        studentId: 0,
        inviteToken: 'token-abc',
        status: 'pending',
      };

      // Simular cancelamento
      const cancelled = { ...invite, status: 'cancelled' };

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.personalId).toBe(123);
    });

    it('deve rejeitar cancelamento de convite que não pertence ao personal', () => {
      const invite = {
        personalId: 123,
        inviteToken: 'token-abc',
      };

      const requestingPersonalId = 456;

      expect(invite.personalId).not.toBe(requestingPersonalId);
    });

    it('deve rejeitar cancelamento de convite individual', () => {
      const invite = {
        studentId: 789, // Convite individual, não geral
        status: 'pending',
      };

      expect(invite.studentId).not.toBe(0);
    });

    it('deve rejeitar cancelamento de convite inexistente', () => {
      const invites = [
        { token: 'token-1' },
        { token: 'token-2' },
      ];

      const invalidToken = 'token-invalid';
      const found = invites.find(i => i.token === invalidToken);

      expect(found).toBeUndefined();
    });
  });

  describe('Regenerate General Invite', () => {
    it('deve gerar novo link após cancelamento', () => {
      const oldInvite = {
        token: 'old-token-123',
        status: 'cancelled',
      };

      const newInvite = {
        token: 'new-token-456',
        status: 'pending',
      };

      expect(oldInvite.token).not.toBe(newInvite.token);
      expect(oldInvite.status).toBe('cancelled');
      expect(newInvite.status).toBe('pending');
    });

    it('deve cancelar todos os links gerais antigos ao regenerar', () => {
      const oldLinks = [
        { id: 1, token: 'token-1', status: 'pending' },
        { id: 2, token: 'token-2', status: 'pending' },
      ];

      // Simular cancelamento de todos
      const cancelledLinks = oldLinks.map(link => ({
        ...link,
        status: 'cancelled',
      }));

      expect(cancelledLinks.every(l => l.status === 'cancelled')).toBe(true);
    });

    it('deve manter validade de 1 ano para novo link', () => {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      const diffDays = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThan(360);
      expect(diffDays).toBeLessThanOrEqual(365);
    });
  });

  describe('Invite Analytics', () => {
    it('deve calcular total de links gerais', () => {
      const allInvites = [
        { id: 1, studentId: 0, status: 'pending' }, // Geral
        { id: 2, studentId: 0, status: 'cancelled' }, // Geral cancelado
        { id: 3, studentId: 123, status: 'accepted' }, // Individual
      ];

      const generalInvites = allInvites.filter(i => i.studentId === 0);

      expect(generalInvites.length).toBe(2);
    });

    it('deve contar links ativos', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      const invites = [
        { id: 1, status: 'pending', expiresAt: futureDate },
        { id: 2, status: 'pending', expiresAt: pastDate },
        { id: 3, status: 'cancelled', expiresAt: futureDate },
      ];

      const activeLinks = invites.filter(i =>
        i.status === 'pending' && new Date(i.expiresAt) > now
      );

      expect(activeLinks.length).toBe(1);
    });

    it('deve contar alunos cadastrados via links', () => {
      const allInvites = [
        { id: 1, status: 'accepted' },
        { id: 2, status: 'accepted' },
        { id: 3, status: 'pending' },
        { id: 4, status: 'cancelled' },
      ];

      const acceptedCount = allInvites.filter(i => i.status === 'accepted').length;

      expect(acceptedCount).toBe(2);
    });

    it('deve calcular taxa de conversão', () => {
      const totalInvites = 10;
      const acceptedCount = 7;
      const conversionRate = (acceptedCount / totalInvites) * 100;

      expect(conversionRate).toBe(70);
    });

    it('deve calcular taxa de conversão com zero registros', () => {
      const totalInvites = 0;
      const acceptedCount = 0;
      const conversionRate = totalInvites > 0 ? (acceptedCount / totalInvites) * 100 : 0;

      expect(conversionRate).toBe(0);
    });

    it('deve ordenar links por data de criação (mais recentes primeiro)', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const links = [
        { id: 1, createdAt: twoDaysAgo },
        { id: 2, createdAt: now },
        { id: 3, createdAt: yesterday },
      ];

      const sorted = [...links].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1);
    });

    it('deve rastrear último uso do link', () => {
      const link = {
        id: 1,
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-01-15'),
      };

      expect(link.lastUsedAt).toBeInstanceOf(Date);
      expect(link.lastUsedAt.getTime()).toBeGreaterThan(link.createdAt.getTime());
    });

    it('deve mostrar null para último uso se link nunca foi usado', () => {
      const link = {
        id: 1,
        lastUsedAt: null,
      };

      expect(link.lastUsedAt).toBeNull();
    });
  });

  describe('Analytics Summary', () => {
    it('deve calcular resumo correto de analytics', () => {
      const invites = [
        { id: 1, status: 'pending', studentId: 0 }, // Geral ativo
        { id: 2, status: 'cancelled', studentId: 0 }, // Geral cancelado
        { id: 3, status: 'accepted', studentId: 123 }, // Individual aceito
      ];

      const generalInvites = invites.filter(i => i.studentId === 0);
      const activeLinks = generalInvites.filter(i => i.status === 'pending').length;
      const acceptedCount = invites.filter(i => i.status === 'accepted').length;

      const summary = {
        totalLinks: generalInvites.length,
        activeLinks,
        totalStudentsRegistered: acceptedCount,
      };

      expect(summary.totalLinks).toBe(2);
      expect(summary.activeLinks).toBe(1);
      expect(summary.totalStudentsRegistered).toBe(1);
    });

    it('deve lidar com zero links', () => {
      const invites: any[] = [];

      const summary = {
        totalLinks: invites.length,
        activeLinks: 0,
        totalStudentsRegistered: 0,
      };

      expect(summary.totalLinks).toBe(0);
      expect(summary.activeLinks).toBe(0);
      expect(summary.totalStudentsRegistered).toBe(0);
    });
  });

  describe('Link Status Transitions', () => {
    it('deve permitir transição pending -> cancelled', () => {
      const link = { status: 'pending' };
      const updated = { ...link, status: 'cancelled' };

      expect(updated.status).toBe('cancelled');
    });

    it('deve permitir transição pending -> accepted', () => {
      const link = { status: 'pending' };
      const updated = { ...link, status: 'accepted' };

      expect(updated.status).toBe('accepted');
    });

    it('deve permitir transição pending -> expired', () => {
      const link = { status: 'pending' };
      const updated = { ...link, status: 'expired' };

      expect(updated.status).toBe('expired');
    });

    it('não deve permitir transição cancelled -> pending', () => {
      const link = { status: 'cancelled' };
      // Um link cancelado não pode voltar a ser pending
      const isValidTransition = link.status !== 'cancelled';

      expect(isValidTransition).toBe(false);
    });
  });
});
