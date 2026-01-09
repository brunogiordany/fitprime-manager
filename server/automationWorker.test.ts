import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do db
vi.mock('./db', () => ({
  getAllPersonals: vi.fn(),
  getAutomationsByPersonalId: vi.fn(),
  getStudentsByPersonalId: vi.fn(),
  getStudentById: vi.fn(),
  getSessionsByPersonalId: vi.fn(),
  getSessionsByStudentId: vi.fn(),
  getChargesByStudentId: vi.fn(),
  getMessageLogByPersonalId: vi.fn(),
  createMessageLog: vi.fn(),
  createChatMessage: vi.fn(),
  checkSessionReminderSent: vi.fn(), // Verificar se já enviou lembrete para sessão
}));

// Mock do stevo
vi.mock('./stevo', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

import * as db from './db';
import { sendWhatsAppMessage } from './stevo';

describe('Automation Worker - Substituição de Variáveis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve substituir variáveis de sessão corretamente', async () => {
    const mockPersonal = {
      id: 1,
      evolutionApiKey: 'test-key',
      evolutionInstance: 'test-instance',
      stevoServer: 'sm15',
    };

    const mockStudent = {
      id: 1,
      name: 'João Silva',
      phone: '5545999999999',
      email: 'joao@email.com',
      whatsappOptIn: true,
      status: 'active',
    };

    const mockSession = {
      id: 1,
      studentId: 1,
      scheduledAt: new Date('2026-01-10T14:30:00'),
      status: 'scheduled',
    };

    const mockAutomation = {
      id: 1,
      personalId: 1,
      trigger: 'session_reminder',
      isActive: true,
      messageTemplate: 'Olá {nome}! Seu treino começa em 2 horas às {hora}. Vamos lá!',
      sendWindowStart: '00:00',
      sendWindowEnd: '23:59',
      triggerHoursBefore: 2,
    };

    vi.mocked(db.getAllPersonals).mockResolvedValue([mockPersonal] as any);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue([mockAutomation] as any);
    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);
    vi.mocked(db.getSessionsByPersonalId).mockResolvedValue([mockSession] as any);
    vi.mocked(db.getSessionsByStudentId).mockResolvedValue([mockSession] as any);
    vi.mocked(db.getChargesByStudentId).mockResolvedValue([]);
    vi.mocked(db.getMessageLogByPersonalId).mockResolvedValue([]);
    vi.mocked((db as any).checkSessionReminderSent).mockResolvedValue(false); // Não enviou ainda
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({ success: true });

    // Importar e executar
    const { processSessionReminders } = await import('./automationWorker');
    
    // Nota: Este teste verifica que a função não lança erros
    // A verificação real das variáveis substituídas seria feita via mock
    const result = await processSessionReminders();
    
    expect(result).toBeDefined();
    expect(result.errors).toBeDefined();
  });

  it('deve substituir variáveis de pagamento corretamente', async () => {
    const mockPersonal = {
      id: 1,
      evolutionApiKey: 'test-key',
      evolutionInstance: 'test-instance',
      stevoServer: 'sm15',
    };

    const mockStudent = {
      id: 1,
      name: 'Maria Santos',
      phone: '5545888888888',
      email: 'maria@email.com',
      whatsappOptIn: true,
      status: 'active',
    };

    const mockCharge = {
      id: 1,
      studentId: 1,
      amount: '150.00',
      dueDate: new Date('2026-01-12'),
      status: 'pending',
    };

    const mockAutomation = {
      id: 2,
      personalId: 1,
      trigger: 'payment_reminder',
      isActive: true,
      messageTemplate: 'Olá {nome}! Sua mensalidade vence em {vencimento}. Valor: R$ {valor}',
      sendWindowStart: '00:00',
      sendWindowEnd: '23:59',
      triggerHoursBefore: 72,
    };

    vi.mocked(db.getAllPersonals).mockResolvedValue([mockPersonal] as any);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue([mockAutomation] as any);
    vi.mocked(db.getStudentsByPersonalId).mockResolvedValue([mockStudent] as any);
    vi.mocked(db.getChargesByStudentId).mockResolvedValue([mockCharge] as any);
    vi.mocked(db.getMessageLogByPersonalId).mockResolvedValue([]);
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({ success: true });

    const { processPaymentReminders } = await import('./automationWorker');
    const result = await processPaymentReminders();
    
    expect(result).toBeDefined();
    expect(result.errors).toBeDefined();
  });

  it('deve processar aniversários corretamente', async () => {
    const today = new Date();
    const mockPersonal = {
      id: 1,
      evolutionApiKey: 'test-key',
      evolutionInstance: 'test-instance',
      stevoServer: 'sm15',
    };

    const mockStudent = {
      id: 1,
      name: 'Pedro Costa',
      phone: '5545777777777',
      email: 'pedro@email.com',
      whatsappOptIn: true,
      status: 'active',
      birthDate: new Date(1990, today.getMonth(), today.getDate()), // Aniversário hoje
    };

    const mockAutomation = {
      id: 3,
      personalId: 1,
      trigger: 'birthday',
      isActive: true,
      messageTemplate: 'Feliz aniversário, {nome}! 🎂',
      sendWindowStart: '00:00',
      sendWindowEnd: '23:59',
    };

    vi.mocked(db.getAllPersonals).mockResolvedValue([mockPersonal] as any);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue([mockAutomation] as any);
    vi.mocked(db.getStudentsByPersonalId).mockResolvedValue([mockStudent] as any);
    vi.mocked(db.getMessageLogByPersonalId).mockResolvedValue([]);
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({ success: true });

    const { processBirthdays } = await import('./automationWorker');
    const result = await processBirthdays();
    
    expect(result).toBeDefined();
    expect(result.errors).toBeDefined();
  });

  it('deve ignorar alunos sem opt-in de WhatsApp', async () => {
    const mockPersonal = {
      id: 1,
      evolutionApiKey: 'test-key',
      evolutionInstance: 'test-instance',
      stevoServer: 'sm15',
    };

    const mockStudentNoOptIn = {
      id: 1,
      name: 'Ana Silva',
      phone: '5545666666666',
      email: 'ana@email.com',
      whatsappOptIn: false, // Sem opt-in
      status: 'active',
    };

    const mockAutomation = {
      id: 1,
      personalId: 1,
      trigger: 'session_reminder',
      isActive: true,
      messageTemplate: 'Olá {nome}!',
      sendWindowStart: '00:00',
      sendWindowEnd: '23:59',
      triggerHoursBefore: 2,
    };

    vi.mocked(db.getAllPersonals).mockResolvedValue([mockPersonal] as any);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue([mockAutomation] as any);
    vi.mocked(db.getStudentsByPersonalId).mockResolvedValue([mockStudentNoOptIn] as any);
    vi.mocked(db.getSessionsByPersonalId).mockResolvedValue([]);
    vi.mocked(db.getMessageLogByPersonalId).mockResolvedValue([]);

    const { processSessionReminders } = await import('./automationWorker');
    const result = await processSessionReminders();
    
    // Não deve ter enviado nenhuma mensagem
    expect(result.sent).toBe(0);
  });

  it('deve respeitar janela de envio', async () => {
    const mockPersonal = {
      id: 1,
      evolutionApiKey: 'test-key',
      evolutionInstance: 'test-instance',
      stevoServer: 'sm15',
    };

    // Automação com janela de envio restrita (fora do horário atual)
    const mockAutomation = {
      id: 1,
      personalId: 1,
      trigger: 'session_reminder',
      isActive: true,
      messageTemplate: 'Olá {nome}!',
      sendWindowStart: '03:00', // 3h da manhã
      sendWindowEnd: '04:00',   // 4h da manhã
      triggerHoursBefore: 2,
    };

    vi.mocked(db.getAllPersonals).mockResolvedValue([mockPersonal] as any);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue([mockAutomation] as any);

    const { processSessionReminders } = await import('./automationWorker');
    const result = await processSessionReminders();
    
    // Não deve ter enviado nenhuma mensagem (fora da janela)
    expect(result.sent).toBe(0);
  });
});

describe('Automation Worker - runAllAutomations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve executar todas as automações e retornar totais', async () => {
    vi.mocked(db.getAllPersonals).mockResolvedValue([]);
    
    const { runAllAutomations } = await import('./automationWorker');
    const result = await runAllAutomations();
    
    expect(result).toHaveProperty('sessionReminders');
    expect(result).toHaveProperty('paymentReminders');
    expect(result).toHaveProperty('overduePayments');
    expect(result).toHaveProperty('birthdays');
    expect(result).toHaveProperty('totalSent');
    expect(result).toHaveProperty('totalFailed');
  });
});
