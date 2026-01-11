// Teste direto da API de geração de treino
import fetch from 'node-fetch';

const BASE_URL = 'https://3000-idlmayh14gc5kzu7qnrda-776fd87e.us1.manus.computer';

async function testGenerateWorkout() {
  console.log('Testando geração de treino...');
  
  // Primeiro, fazer login
  const loginResponse = await fetch(`${BASE_URL}/api/trpc/auth.login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'brunogiordany@gmail.com',
      password: 'Br896469'
    }),
  });
  
  console.log('Login status:', loginResponse.status);
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Cookies:', cookies);
  
  // Agora, chamar a API de geração de treino
  const generateResponse = await fetch(`${BASE_URL}/api/trpc/workouts.generateWithAI`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
    body: JSON.stringify({
      studentId: 4, // ID da Laura
    }),
  });
  
  console.log('Generate status:', generateResponse.status);
  const text = await generateResponse.text();
  console.log('Response:', text.substring(0, 1000));
}

testGenerateWorkout().catch(console.error);
