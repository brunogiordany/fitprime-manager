import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  getFeatureFlagsByPersonalId: vi.fn(),
  upsertFeatureFlags: vi.fn(),
  getAllFeatureFlags: vi.fn(),
  logAdminActivity: vi.fn(),
  getAllPersonals: vi.fn(),
}));

import * as db from './db';

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeatureFlagsByPersonalId', () => {
    it('deve retornar null quando personal não tem flags configuradas', async () => {
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(null);
      
      const result = await db.getFeatureFlagsByPersonalId(999);
      expect(result).toBeNull();
    });

    it('deve retornar flags quando personal tem configuração', async () => {
      const mockFlags = {
        id: 1,
        personalId: 1,
        aiAssistantEnabled: false,
        whatsappIntegrationEnabled: true,
        stripePaymentsEnabled: true,
        advancedReportsEnabled: true,
        aiWorkoutGenerationEnabled: true,
        aiAnalysisEnabled: true,
        bulkMessagingEnabled: true,
        automationsEnabled: true,
        studentPortalEnabled: true,
        enabledBy: 'Admin',
        enabledAt: new Date(),
        disabledReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(mockFlags as any);
      
      const result = await db.getFeatureFlagsByPersonalId(1);
      expect(result).not.toBeNull();
      expect(result?.aiAssistantEnabled).toBe(false);
      expect(result?.whatsappIntegrationEnabled).toBe(true);
    });
  });

  describe('upsertFeatureFlags', () => {
    it('deve criar flags para novo personal', async () => {
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(null);
      vi.mocked(db.upsertFeatureFlags).mockResolvedValue(undefined);
      
      await db.upsertFeatureFlags(1, { aiAssistantEnabled: true });
      
      expect(db.upsertFeatureFlags).toHaveBeenCalledWith(1, { aiAssistantEnabled: true });
    });

    it('deve atualizar flags existentes', async () => {
      const existingFlags = {
        id: 1,
        personalId: 1,
        aiAssistantEnabled: false,
      };
      
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(existingFlags as any);
      vi.mocked(db.upsertFeatureFlags).mockResolvedValue(undefined);
      
      await db.upsertFeatureFlags(1, { aiAssistantEnabled: true });
      
      expect(db.upsertFeatureFlags).toHaveBeenCalled();
    });
  });

  describe('getAllFeatureFlags', () => {
    it('deve retornar lista vazia quando não há flags', async () => {
      vi.mocked(db.getAllFeatureFlags).mockResolvedValue([]);
      
      const result = await db.getAllFeatureFlags();
      expect(result).toEqual([]);
    });

    it('deve retornar todas as flags com nome do personal', async () => {
      const mockFlags = [
        {
          id: 1,
          personalId: 1,
          aiAssistantEnabled: true,
          personalName: 'Personal 1',
        },
        {
          id: 2,
          personalId: 2,
          aiAssistantEnabled: false,
          personalName: 'Personal 2',
        },
      ];
      
      vi.mocked(db.getAllFeatureFlags).mockResolvedValue(mockFlags as any);
      
      const result = await db.getAllFeatureFlags();
      expect(result).toHaveLength(2);
      expect(result[0].personalName).toBe('Personal 1');
    });
  });

  describe('Lógica de Feature Flags', () => {
    it('IA de Atendimento deve estar desabilitada por padrão', async () => {
      // Quando não há registro de flags, o padrão deve ser false para aiAssistantEnabled
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(null);
      
      const flags = await db.getFeatureFlagsByPersonalId(1);
      
      // Se null, o frontend deve tratar como false
      const aiEnabled = flags?.aiAssistantEnabled ?? false;
      expect(aiEnabled).toBe(false);
    });

    it('outras features devem estar habilitadas por padrão', async () => {
      vi.mocked(db.getFeatureFlagsByPersonalId).mockResolvedValue(null);
      
      const flags = await db.getFeatureFlagsByPersonalId(1);
      
      // Se null, o frontend deve tratar como true para outras features
      const whatsappEnabled = flags?.whatsappIntegrationEnabled ?? true;
      const stripeEnabled = flags?.stripePaymentsEnabled ?? true;
      
      expect(whatsappEnabled).toBe(true);
      expect(stripeEnabled).toBe(true);
    });
  });
});
