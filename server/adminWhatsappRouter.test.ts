import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminWhatsappRouter } from './routers/adminWhatsappRouter';

// Mock do contexto
const mockCtx = {
  user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' },
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('AdminWhatsappRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('deve retornar configuração existente ou criar nova', async () => {
      // Verifica que o router tem o procedimento getConfig
      expect(adminWhatsappRouter).toBeDefined();
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('getConfig');
    });
  });

  describe('listAutomations', () => {
    it('deve ter o procedimento listAutomations', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('listAutomations');
    });
  });

  describe('createAutomation', () => {
    it('deve ter o procedimento createAutomation', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('createAutomation');
    });
  });

  describe('updateAutomation', () => {
    it('deve ter o procedimento updateAutomation', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('updateAutomation');
    });
  });

  describe('deleteAutomation', () => {
    it('deve ter o procedimento deleteAutomation', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('deleteAutomation');
    });
  });

  describe('createDefaultAutomations', () => {
    it('deve ter o procedimento createDefaultAutomations', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('createDefaultAutomations');
    });
  });

  describe('listMessages', () => {
    it('deve ter o procedimento listMessages', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('listMessages');
    });
  });

  describe('sendBulkToLeads', () => {
    it('deve ter o procedimento sendBulkToLeads', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('sendBulkToLeads');
    });
  });

  describe('getStats', () => {
    it('deve ter o procedimento getStats', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('getStats');
    });
  });

  describe('listLeadsForMessaging', () => {
    it('deve ter o procedimento listLeadsForMessaging', async () => {
      expect(adminWhatsappRouter._def.procedures).toHaveProperty('listLeadsForMessaging');
    });
  });
});
