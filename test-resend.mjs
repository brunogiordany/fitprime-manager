import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
  console.log('Testing Resend API with fitprimemanager.online...');
  console.log('API Key exists:', !!process.env.RESEND_API_KEY);
  
  try {
    const result = await resend.emails.send({
      from: 'FitPrime <noreply@fitprimemanager.online>',
      to: 'visionixenterprise@gmail.com',
      subject: 'Teste FitPrime Online - ' + new Date().toLocaleString('pt-BR'),
      html: '<h1>🎉 Teste de Email FitPrime</h1><p>Este é um teste direto da API Resend usando o domínio <strong>fitprimemanager.online</strong>.</p><p>Se você recebeu este email, a configuração está funcionando!</p>',
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.data?.id) {
      console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('ID do email:', result.data.id);
    } else if (result.error) {
      console.log('\n❌ ERRO NO ENVIO:');
      console.log('Mensagem:', result.error.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSend();
