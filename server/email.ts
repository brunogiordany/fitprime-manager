/**
 * Email service for FitPrime
 * Uses Resend API for transactional emails
 * 
 * Note: For production, you need to configure RESEND_API_KEY in environment
 * For now, we'll use a placeholder that logs emails to console
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 * Returns true if email was sent successfully
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  console.log(`[Email] Iniciando envio para ${payload.to}`);
  console.log(`[Email] API Key presente: ${apiKey ? 'Sim (primeiros 10 chars: ' + apiKey.substring(0, 10) + '...)' : 'NÃO'}`);
  
  // If no API key, log to console (development mode)
  if (!apiKey) {
    console.log('[Email] Development mode - Email would be sent:');
    console.log(`  To: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Content: ${payload.text || payload.html.substring(0, 200)}...`);
    return true;
  }

  try {
    const emailData = {
      from: 'FitPrime <onboarding@resend.dev>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    };
    
    console.log(`[Email] Enviando para Resend API...`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await response.text();
    console.log(`[Email] Resposta Resend (status ${response.status}): ${responseText}`);

    if (!response.ok) {
      console.error('[Email] Failed to send:', responseText);
      return false;
    }

    console.log(`[Email] Sent successfully to ${payload.to}`);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Send invite email to student
 */
export async function sendInviteEmail(
  studentEmail: string,
  studentName: string,
  personalName: string,
  inviteLink: string
): Promise<boolean> {
  const subject = `${personalName} convidou você para o FitPrime`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">💪</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Bem-vindo ao FitPrime!</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        <strong>${personalName}</strong> convidou você para acessar o Portal do Aluno do FitPrime. 
        Lá você poderá ver seus treinos, acompanhar sua evolução e muito mais!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Criar minha conta
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
        <a href="${inviteLink}" style="color: #10b981;">${inviteLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Este link expira em 7 dias. Se você não solicitou este convite, ignore este email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

${personalName} convidou você para acessar o Portal do Aluno do FitPrime.

Clique no link abaixo para criar sua conta:
${inviteLink}

Este link expira em 7 dias.

Se você não solicitou este convite, ignore este email.
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(
  studentEmail: string,
  studentName: string,
  loginLink: string
): Promise<boolean> {
  const subject = 'Bem-vindo ao FitPrime! 🎉';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🎉</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Cadastro Realizado!</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Sua conta no FitPrime foi criada com sucesso! Agora você pode acessar o Portal do Aluno 
        para ver seus treinos, acompanhar sua evolução e muito mais.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Acessar Portal do Aluno
        </a>
      </div>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #166534; font-size: 14px; margin: 0;">
          <strong>Próximo passo:</strong> Complete sua anamnese para que seu personal possa criar treinos personalizados para você!
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Guarde este email para referência futura.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

Sua conta no FitPrime foi criada com sucesso!

Acesse o Portal do Aluno:
${loginLink}

Próximo passo: Complete sua anamnese para que seu personal possa criar treinos personalizados para você!

Guarde este email para referência futura.
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}


/**
 * Send session reminder email to student
 */
export async function sendSessionReminderEmail(
  studentEmail: string,
  studentName: string,
  sessionDate: Date,
  personalName: string,
  hoursUntil: number
): Promise<boolean> {
  const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = sessionDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = hoursUntil <= 2 
    ? `⏰ Seu treino começa em ${Math.round(hoursUntil * 60)} minutos!`
    : `📅 Lembrete: Treino amanhã às ${formattedTime}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">⏰</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Lembrete de Treino</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Não esqueça do seu treino com <strong>${personalName}</strong>!
      </p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">
          📅 ${formattedDate}
        </p>
        <p style="color: #166534; font-size: 24px; font-weight: 700; margin: 10px 0 0;">
          ⏰ ${formattedTime}
        </p>
      </div>
      
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Prepare-se para mais uma sessão de treino! Lembre-se de:
      </p>
      <ul style="color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Usar roupas confortáveis</li>
        <li>Levar uma garrafa de água</li>
        <li>Chegar alguns minutos antes</li>
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Bons treinos! 💪
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

Não esqueça do seu treino com ${personalName}!

📅 ${formattedDate}
⏰ ${formattedTime}

Prepare-se para mais uma sessão de treino!

Bons treinos! 💪
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send payment reminder email to student
 */
export async function sendPaymentReminderEmail(
  studentEmail: string,
  studentName: string,
  amount: number,
  dueDate: Date,
  description: string,
  daysUntil: number
): Promise<boolean> {
  const formattedDate = dueDate.toLocaleDateString('pt-BR');
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const isOverdue = daysUntil < 0;
  const subject = isOverdue
    ? `⚠️ Pagamento em atraso - ${description}`
    : `💳 Lembrete de pagamento - Vence em ${daysUntil} dias`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: ${isOverdue ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #f59e0b, #eab308)'}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">${isOverdue ? '⚠️' : '💳'}</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">
          ${isOverdue ? 'Pagamento em Atraso' : 'Lembrete de Pagamento'}
        </h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${isOverdue 
          ? 'Identificamos que você possui um pagamento em atraso.'
          : 'Este é um lembrete sobre um pagamento próximo do vencimento.'}
      </p>
      
      <div style="background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: ${isOverdue ? '#991b1b' : '#92400e'}; font-size: 14px; margin: 0 0 10px;">
          <strong>Descrição:</strong> ${description}
        </p>
        <p style="color: ${isOverdue ? '#991b1b' : '#92400e'}; font-size: 14px; margin: 0 0 10px;">
          <strong>Vencimento:</strong> ${formattedDate}
        </p>
        <p style="color: ${isOverdue ? '#991b1b' : '#92400e'}; font-size: 24px; font-weight: 700; margin: 10px 0 0;">
          ${formattedAmount}
        </p>
      </div>
      
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        ${isOverdue
          ? 'Por favor, regularize sua situação o mais breve possível para evitar interrupção dos serviços.'
          : 'Mantenha seus pagamentos em dia para continuar aproveitando todos os benefícios.'}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Em caso de dúvidas, entre em contato com seu personal trainer.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

${isOverdue 
  ? 'Identificamos que você possui um pagamento em atraso.'
  : 'Este é um lembrete sobre um pagamento próximo do vencimento.'}

Descrição: ${description}
Vencimento: ${formattedDate}
Valor: ${formattedAmount}

${isOverdue
  ? 'Por favor, regularize sua situação o mais breve possível.'
  : 'Mantenha seus pagamentos em dia.'}

Em caso de dúvidas, entre em contato com seu personal trainer.
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send session confirmation email to student
 */
export async function sendSessionConfirmationEmail(
  studentEmail: string,
  studentName: string,
  sessionDate: Date,
  action: 'confirmed' | 'cancelled'
): Promise<boolean> {
  const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = sessionDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isConfirmed = action === 'confirmed';
  const subject = isConfirmed
    ? `✅ Presença confirmada - ${formattedDate}`
    : `❌ Sessão cancelada - ${formattedDate}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: ${isConfirmed ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'linear-gradient(135deg, #6b7280, #9ca3af)'}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">${isConfirmed ? '✅' : '❌'}</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">
          ${isConfirmed ? 'Presença Confirmada!' : 'Sessão Cancelada'}
        </h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${isConfirmed
          ? 'Sua presença foi confirmada com sucesso!'
          : 'Sua sessão foi cancelada conforme solicitado.'}
      </p>
      
      <div style="background-color: ${isConfirmed ? '#f0fdf4' : '#f9fafb'}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: ${isConfirmed ? '#166534' : '#4b5563'}; font-size: 16px; margin: 0;">
          📅 ${formattedDate}
        </p>
        <p style="color: ${isConfirmed ? '#166534' : '#4b5563'}; font-size: 20px; font-weight: 600; margin: 10px 0 0;">
          ⏰ ${formattedTime}
        </p>
      </div>
      
      ${isConfirmed ? `
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Estamos te esperando! Não esqueça de se preparar para o treino.
      </p>
      ` : `
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Se precisar reagendar, entre em contato com seu personal trainer.
      </p>
      `}
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        FitPrime - Seu parceiro de treinos 💪
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

${isConfirmed
  ? 'Sua presença foi confirmada com sucesso!'
  : 'Sua sessão foi cancelada conforme solicitado.'}

📅 ${formattedDate}
⏰ ${formattedTime}

${isConfirmed
  ? 'Estamos te esperando! Não esqueça de se preparar para o treino.'
  : 'Se precisar reagendar, entre em contato com seu personal trainer.'}

FitPrime - Seu parceiro de treinos 💪
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}


/**
 * Envia email de recuperação de senha com código de 6 dígitos
 */
export async function sendPasswordResetEmail(
  studentEmail: string,
  studentName: string,
  code: string
): Promise<boolean> {
  const subject = '🔐 Código de Recuperação de Senha - FitPrime';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🔐</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Recuperação de Senha</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${studentName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Recebemos uma solicitação para redefinir a senha da sua conta no FitPrime. Use o código abaixo para continuar:
      </p>
      
      <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px solid #10b981; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">
          Seu código de verificação
        </p>
        <p style="color: #10b981; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: monospace;">
          ${code}
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
        ⏱️ Este código expira em <strong>15 minutos</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
        Se você não solicitou a recuperação de senha, ignore este email. Sua conta permanece segura.
      </p>
      
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
        Por segurança, nunca compartilhe este código com ninguém.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        FitPrime - Seu parceiro de treinos 💪
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${studentName},

Recebemos uma solicitação para redefinir a senha da sua conta no FitPrime.

Seu código de verificação: ${code}

⏱️ Este código expira em 15 minutos.

Se você não solicitou a recuperação de senha, ignore este email.

FitPrime - Seu parceiro de treinos 💪
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  });
}
