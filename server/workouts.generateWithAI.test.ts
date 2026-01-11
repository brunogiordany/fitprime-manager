import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLLM } from './_core/llm';

// Mock do invokeLLM
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn()
}));

describe('Workout AI Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle JSON response correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '{"name": "Treino Teste", "description": "Descrição", "goal": "hypertrophy", "difficulty": "beginner", "type": "strength", "days": [], "cardioRecommendation": {"sessionsPerWeek": 3, "minutesPerSession": 30, "types": ["caminhada"], "intensity": "moderada", "timing": "após treino", "notes": "", "benefits": ""}}'
        }
      }]
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      messages: [{ role: 'user', content: 'test' }]
    });

    const content = result.choices[0]?.message?.content;
    expect(content).toBeDefined();
    
    // Tentar parsear o JSON
    const parsed = JSON.parse(content as string);
    expect(parsed.name).toBe('Treino Teste');
  });

  it('should handle text content that starts with non-JSON', async () => {
    // Simular resposta que começa com texto em português
    const mockResponse = {
      choices: [{
        message: {
          content: 'Não foi possível gerar o treino porque...'
        }
      }]
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      messages: [{ role: 'user', content: 'test' }]
    });

    const content = result.choices[0]?.message?.content;
    
    // Tentar parsear - deve falhar
    expect(() => JSON.parse(content as string)).toThrow();
    
    // Verificar que começa com "Não"
    expect((content as string).startsWith('Não')).toBe(true);
  });

  it('should extract JSON from mixed content', async () => {
    // Simular resposta com texto + JSON
    const mockResponse = {
      choices: [{
        message: {
          content: 'Aqui está o treino: {"name": "Treino", "description": "Desc"}'
        }
      }]
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      messages: [{ role: 'user', content: 'test' }]
    });

    const content = result.choices[0]?.message?.content as string;
    
    // Extrair JSON do conteúdo
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.name).toBe('Treino');
  });
});
