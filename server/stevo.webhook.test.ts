import { describe, it, expect } from 'vitest';
import { 
  isPaymentConfirmation, 
  hasPaymentProof, 
  analyzePaymentMessage,
  generatePaymentResponseMessage,
  StevoWebhookMessage
} from './stevo';

describe('Stevo Webhook - Payment Detection', () => {
  describe('isPaymentConfirmation', () => {
    it('should detect "já paguei" as payment confirmation', () => {
      expect(isPaymentConfirmation('já paguei')).toBe(true);
      expect(isPaymentConfirmation('Já paguei!')).toBe(true);
      expect(isPaymentConfirmation('ja paguei')).toBe(true);
    });

    it('should detect "pagamento feito" as payment confirmation', () => {
      expect(isPaymentConfirmation('pagamento feito')).toBe(true);
      expect(isPaymentConfirmation('Pagamento realizado')).toBe(true);
      expect(isPaymentConfirmation('pagamento efetuado')).toBe(true);
    });

    it('should detect "fiz o pix" as payment confirmation', () => {
      expect(isPaymentConfirmation('fiz o pix')).toBe(true);
      expect(isPaymentConfirmation('Fiz pix')).toBe(true);
      expect(isPaymentConfirmation('fiz o pagamento')).toBe(true);
      expect(isPaymentConfirmation('transferi')).toBe(true);
    });

    it('should detect "comprovante" as payment confirmation', () => {
      expect(isPaymentConfirmation('segue comprovante')).toBe(true);
      expect(isPaymentConfirmation('segue o pix')).toBe(true);
    });

    it('should detect "ta pago" variations as payment confirmation', () => {
      expect(isPaymentConfirmation('ta pago')).toBe(true);
      expect(isPaymentConfirmation('tá pago')).toBe(true);
      expect(isPaymentConfirmation('está pago')).toBe(true);
    });

    it('should NOT detect unrelated messages', () => {
      expect(isPaymentConfirmation('olá')).toBe(false);
      expect(isPaymentConfirmation('bom dia')).toBe(false);
      expect(isPaymentConfirmation('quanto custa?')).toBe(false);
      expect(isPaymentConfirmation('vou pagar amanhã')).toBe(false);
    });
  });

  describe('hasPaymentProof', () => {
    it('should return true for image messages', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: '',
        messageType: 'image',
        timestamp: Date.now(),
      };
      expect(hasPaymentProof(message)).toBe(true);
    });

    it('should return true for document messages', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: '',
        messageType: 'document',
        timestamp: Date.now(),
      };
      expect(hasPaymentProof(message)).toBe(true);
    });

    it('should return true for text mentioning comprovante', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: 'segue comprovante',
        messageType: 'text',
        timestamp: Date.now(),
      };
      expect(hasPaymentProof(message)).toBe(true);
    });

    it('should return false for regular text messages', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: 'olá, tudo bem?',
        messageType: 'text',
        timestamp: Date.now(),
      };
      expect(hasPaymentProof(message)).toBe(false);
    });
  });

  describe('analyzePaymentMessage', () => {
    it('should suggest auto_confirm for image messages', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: '',
        messageType: 'image',
        timestamp: Date.now(),
      };
      const result = analyzePaymentMessage(message);
      expect(result.isPaymentRelated).toBe(true);
      expect(result.hasProof).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedAction).toBe('auto_confirm');
    });

    it('should suggest manual_review for text confirmation without proof', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: 'já paguei',
        messageType: 'text',
        timestamp: Date.now(),
      };
      const result = analyzePaymentMessage(message);
      expect(result.isPaymentRelated).toBe(true);
      expect(result.isConfirmation).toBe(true);
      expect(result.hasProof).toBe(false);
      expect(result.confidence).toBe('medium');
      expect(result.suggestedAction).toBe('manual_review');
    });

    it('should suggest ignore for unrelated messages', () => {
      const message: StevoWebhookMessage = {
        instanceName: 'test',
        from: '5511999999999',
        message: 'olá, bom dia!',
        messageType: 'text',
        timestamp: Date.now(),
      };
      const result = analyzePaymentMessage(message);
      expect(result.isPaymentRelated).toBe(false);
      expect(result.suggestedAction).toBe('ignore');
    });
  });

  describe('generatePaymentResponseMessage', () => {
    it('should generate confirmed message', () => {
      const message = generatePaymentResponseMessage('João', 'confirmed');
      expect(message).toContain('João');
      expect(message).toContain('confirmado');
      expect(message).toContain('✅');
    });

    it('should generate pending review message', () => {
      const message = generatePaymentResponseMessage('Maria', 'pending_review');
      expect(message).toContain('Maria');
      expect(message).toContain('verificar');
    });
  });
});
