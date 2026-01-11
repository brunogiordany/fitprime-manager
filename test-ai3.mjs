import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const apiUrl = `${FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`;

console.log('API URL:', apiUrl);

const payload = {
  model: "gemini-2.5-flash",
  messages: [
    { role: 'system', content: 'Você é um personal trainer que cria treinos. Retorne APENAS JSON válido.' },
    { role: 'user', content: 'Crie um treino simples para iniciante. Retorne APENAS o JSON, sem texto adicional.' },
  ],
  max_tokens: 32768,
  thinking: { budget_tokens: 128 },
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
          goal: { type: 'string', enum: ['hypertrophy', 'weight_loss', 'general'] },
          difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          type: { type: 'string', enum: ['strength', 'cardio', 'mixed'] },
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
                    },
                    required: ['name', 'muscleGroup', 'sets', 'reps', 'restSeconds'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['name', 'exercises'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'description', 'goal', 'difficulty', 'type', 'days'],
        additionalProperties: false,
      },
    },
  }
};

console.log('Enviando requisição...');
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': `Bearer ${FORGE_API_KEY}`,
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('\n=== CONTENT ===');
const content = result.choices?.[0]?.message?.content;
console.log('Tipo:', typeof content);
console.log('Primeiros 500 chars:', typeof content === 'string' ? content.substring(0, 500) : JSON.stringify(content).substring(0, 500));

// Tentar parsear
try {
  const parsed = JSON.parse(content);
  console.log('\n=== PARSE OK ===');
  console.log('Nome do treino:', parsed.name);
} catch (e) {
  console.log('\n=== PARSE FALHOU ===');
  console.log('Erro:', e.message);
  
  // Tentar extrair JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const extracted = JSON.parse(jsonMatch[0]);
      console.log('JSON extraído com sucesso!');
      console.log('Nome:', extracted.name);
    } catch (e2) {
      console.log('Extração também falhou:', e2.message);
    }
  }
}
