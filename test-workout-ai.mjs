// Teste direto da API de IA para geração de treino

const API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!API_KEY) {
  console.error('API_KEY não configurada');
  process.exit(1);
}

const systemPrompt = `Você é um personal trainer especializado em criar treinos personalizados.
IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional.

Estrutura do JSON:
{
  "name": "Nome do Treino",
  "description": "Descrição",
  "goal": "hypertrophy",
  "difficulty": "beginner",
  "type": "strength",
  "days": [
    {
      "name": "Dia A",
      "exercises": [
        {
          "name": "Supino",
          "muscleGroup": "Peito",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "notes": ""
        }
      ]
    }
  ],
  "cardioRecommendation": {
    "sessionsPerWeek": 3,
    "minutesPerSession": 20,
    "types": ["caminhada"],
    "intensity": "moderada",
    "timing": "após treino",
    "notes": "",
    "benefits": ""
  }
}`;

const userPrompt = `Crie um treino para:
- Nome: Laura
- Gênero: feminino
- Objetivo: hipertrofia
- Experiência: iniciante
- Frequência: 3x por semana
- Sem restrições

Retorne APENAS o JSON, sem texto adicional.`;

async function testAI() {
  console.log('Testando API de IA...');
  console.log('URL:', `${API_URL}/v1/chat/completions`);
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 32768,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'workout_plan',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            goal: { type: 'string' },
            difficulty: { type: 'string' },
            type: { type: 'string' },
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        muscleGroup: { type: 'string' },
                        sets: { type: 'integer' },
                        reps: { type: 'string' },
                        restSeconds: { type: 'integer' },
                        notes: { type: 'string' }
                      },
                      required: ['name', 'muscleGroup', 'sets', 'reps', 'restSeconds'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['name', 'exercises'],
                additionalProperties: false
              }
            },
            cardioRecommendation: {
              type: 'object',
              properties: {
                sessionsPerWeek: { type: 'integer' },
                minutesPerSession: { type: 'integer' },
                types: { type: 'array', items: { type: 'string' } },
                intensity: { type: 'string' },
                timing: { type: 'string' },
                notes: { type: 'string' },
                benefits: { type: 'string' }
              },
              required: ['sessionsPerWeek', 'minutesPerSession', 'types', 'intensity', 'timing', 'notes', 'benefits'],
              additionalProperties: false
            }
          },
          required: ['name', 'description', 'goal', 'difficulty', 'type', 'days', 'cardioRecommendation'],
          additionalProperties: false
        }
      }
    }
  };
  
  try {
    const response = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n=== RESPOSTA DA API ===');
    console.log('Choices:', result.choices?.length);
    
    const content = result.choices?.[0]?.message?.content;
    console.log('\n=== CONTENT TYPE ===');
    console.log('Tipo:', typeof content);
    console.log('É array:', Array.isArray(content));
    
    console.log('\n=== CONTENT (primeiros 1000 chars) ===');
    if (typeof content === 'string') {
      console.log(content.substring(0, 1000));
    } else if (Array.isArray(content)) {
      console.log('Array content:', JSON.stringify(content, null, 2).substring(0, 1000));
    } else {
      console.log('Content:', content);
    }
    
    // Tentar parsear
    let parsed;
    if (typeof content === 'string') {
      try {
        parsed = JSON.parse(content);
        console.log('\n=== JSON PARSEADO COM SUCESSO ===');
        console.log('Nome do treino:', parsed.name);
        console.log('Dias:', parsed.days?.length);
      } catch (e) {
        console.log('\n=== ERRO AO PARSEAR JSON ===');
        console.log('Erro:', e.message);
        console.log('Primeiros 200 chars:', content.substring(0, 200));
      }
    } else if (Array.isArray(content)) {
      const textContent = content.filter(p => p.type === 'text').map(p => p.text).join('');
      try {
        parsed = JSON.parse(textContent);
        console.log('\n=== JSON PARSEADO COM SUCESSO (de array) ===');
        console.log('Nome do treino:', parsed.name);
      } catch (e) {
        console.log('\n=== ERRO AO PARSEAR JSON (de array) ===');
        console.log('Erro:', e.message);
        console.log('Primeiros 200 chars:', textContent.substring(0, 200));
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testAI();
