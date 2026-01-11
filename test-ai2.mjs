import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const apiUrl = `${FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`;

console.log('API URL:', apiUrl);
console.log('API Key exists:', !!FORGE_API_KEY);

const payload = {
  model: "gemini-2.5-flash",
  messages: [
    { role: 'system', content: 'Você é um assistente que retorna JSON.' },
    { role: 'user', content: 'Retorne um JSON simples: {"teste": "ok"}' },
  ],
  max_tokens: 1000,
  thinking: { budget_tokens: 128 },
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'test',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          teste: { type: 'string' }
        },
        required: ['teste'],
        additionalProperties: false
      }
    }
  }
};

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': `Bearer ${FORGE_API_KEY}`,
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('\n=== RESPOSTA COMPLETA ===');
console.log(JSON.stringify(result, null, 2));

console.log('\n=== CONTENT ===');
const content = result.choices?.[0]?.message?.content;
console.log('Tipo:', typeof content);
console.log('É array:', Array.isArray(content));
console.log('Valor:', JSON.stringify(content));

if (Array.isArray(content)) {
  console.log('\n=== É ARRAY ===');
  content.forEach((part, i) => {
    console.log(`Part ${i}:`, JSON.stringify(part));
  });
}
