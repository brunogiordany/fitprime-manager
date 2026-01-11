import { describe, it, expect } from 'vitest';

// Copiar a função para testar isoladamente
function safeJsonParse<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    const parsed = JSON.parse(value);
    // Se o resultado não for um array quando esperamos array, retorna o valor como texto no array
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      // Se for string não vazia, coloca como item do array
      return (typeof parsed === 'string' && parsed.trim()) ? [parsed] as T : defaultValue;
    }
    return parsed;
  } catch {
    // Se não é JSON válido mas é uma string não vazia, coloca como item do array
    if (Array.isArray(defaultValue) && typeof value === 'string' && value.trim() && 
        value.toLowerCase() !== 'nao' && value.toLowerCase() !== 'não') {
      return [value] as T;
    }
    return defaultValue;
  }
}

describe('safeJsonParse', () => {
  describe('com valores nulos ou vazios', () => {
    it('deve retornar defaultValue para null', () => {
      expect(safeJsonParse(null, [])).toEqual([]);
      expect(safeJsonParse(null, 'default')).toBe('default');
    });

    it('deve retornar defaultValue para undefined', () => {
      expect(safeJsonParse(undefined, [])).toEqual([]);
    });

    it('deve retornar defaultValue para string vazia', () => {
      expect(safeJsonParse('', [])).toEqual([]);
    });
  });

  describe('com JSON válido', () => {
    it('deve fazer parse de array JSON válido', () => {
      expect(safeJsonParse('["item1", "item2"]', [])).toEqual(['item1', 'item2']);
    });

    it('deve fazer parse de objeto JSON válido', () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('deve fazer parse de array de objetos', () => {
      const input = '[{"activity": "hipismo", "frequency": 1}]';
      expect(safeJsonParse(input, [])).toEqual([{ activity: 'hipismo', frequency: 1 }]);
    });
  });

  describe('com JSON inválido (caso da Laura)', () => {
    it('deve retornar array vazio para "Nao"', () => {
      expect(safeJsonParse('Nao', [])).toEqual([]);
    });

    it('deve retornar array vazio para "Não"', () => {
      expect(safeJsonParse('Não', [])).toEqual([]);
    });

    it('deve retornar array vazio para "nao" (minúsculo)', () => {
      expect(safeJsonParse('nao', [])).toEqual([]);
    });

    it('deve retornar texto como item do array para texto válido', () => {
      expect(safeJsonParse('Hipismo 1x semana 40min', [])).toEqual(['Hipismo 1x semana 40min']);
    });

    it('deve retornar texto como item do array para "lombar"', () => {
      expect(safeJsonParse('lombar', [])).toEqual(['lombar']);
    });

    it('deve retornar texto como item do array para "glúteos, pernas"', () => {
      expect(safeJsonParse('glúteos, pernas', [])).toEqual(['glúteos, pernas']);
    });
  });

  describe('casos especiais', () => {
    it('deve retornar defaultValue para apenas espaços', () => {
      expect(safeJsonParse('   ', [])).toEqual([]);
    });

    it('deve tratar número como JSON válido', () => {
      expect(safeJsonParse('123', 0)).toBe(123);
    });

    it('deve tratar booleano como JSON válido', () => {
      expect(safeJsonParse('true', false)).toBe(true);
    });
  });
});
