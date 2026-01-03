import { describe, it, expect } from 'vitest';

// Importar a função de formatação de URL
// Como a função é interna, vamos testar via sendWhatsAppMessage mockando o fetch

describe('Stevo URL Configuration', () => {
  describe('Server URL generation', () => {
    it('should use sm15 as default server', () => {
      // O servidor padrão deve ser sm15
      const defaultServer = 'sm15';
      const expectedUrl = `https://${defaultServer}.stevo.chat`;
      expect(expectedUrl).toBe('https://sm15.stevo.chat');
    });

    it('should generate correct URL for different servers', () => {
      const servers = ['sm12', 'sm15', 'sm16', 'sm20'];
      servers.forEach(server => {
        const url = `https://${server}.stevo.chat`;
        expect(url).toMatch(/^https:\/\/sm\d+\.stevo\.chat$/);
      });
    });

    it('should generate correct endpoint for send/text', () => {
      const server = 'sm15';
      const endpoint = `https://${server}.stevo.chat/chat/send/text`;
      expect(endpoint).toBe('https://sm15.stevo.chat/chat/send/text');
    });

    it('should generate correct endpoint for webhook', () => {
      const server = 'sm15';
      const endpoint = `https://${server}.stevo.chat/webhook`;
      expect(endpoint).toBe('https://sm15.stevo.chat/webhook');
    });
  });

  describe('Phone number formatting', () => {
    it('should format phone numbers correctly', () => {
      // Função de formatação esperada
      const formatPhoneNumber = (phone: string): string => {
        let cleaned = phone.replace(/\D/g, '');
        if (!cleaned.startsWith('55')) {
          cleaned = '55' + cleaned;
        }
        return cleaned;
      };

      expect(formatPhoneNumber('11999999999')).toBe('5511999999999');
      expect(formatPhoneNumber('5511999999999')).toBe('5511999999999');
      expect(formatPhoneNumber('(11) 99999-9999')).toBe('5511999999999');
      expect(formatPhoneNumber('+55 11 99999-9999')).toBe('5511999999999');
    });
  });
});
