/**
 * Email service for FitPrime
 * Uses Resend API for transactional emails
 * 
 * Note: For production, you need to configure RESEND_API_KEY in environment
 * For now, we'll use a placeholder that logs emails to console
 */
import * as db from './db';

/**
 * Get email template from database and replace variables
 * Falls back to default template if not found in database
 */
export async function getEmailTemplate(
  templateKey: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string; senderType: string } | null> {
  try {
    const template = await db.getEmailTemplateByKey(templateKey);
    
    if (!template || !template.isActive) {
      return null;
    }
    
    let subject = template.subject;
    let html = template.htmlContent;
    
    // Replace all variables {{variableName}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    }
    
    return {
      subject,
      html,
      senderType: template.senderType,
    };
  } catch (error) {
    console.error('[Email] Error fetching template:', error);
    return null;
  }
}
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Remetentes de email por tipo
export const EMAIL_SENDERS = {
  default: 'FitPrime Manager <noreply@fitprimemanager.online>',
  convites: 'FitPrime Convites <convites@fitprimemanager.online>',
  avisos: 'FitPrime Avisos <avisos@fitprimemanager.online>',
  cobranca: 'FitPrime Cobranças <cobranca@fitprimemanager.online>',
  sistema: 'FitPrime Sistema <sistema@fitprimemanager.online>',
  contato: 'FitPrime Contato <contato@fitprimemanager.online>',
};

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
      from: payload.from || EMAIL_SENDERS.default,
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
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('invite', {
    studentName,
    personalName,
    inviteLink,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: studentEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.convites,
    });
  }
  
  // Fallback to default template
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
    from: EMAIL_SENDERS.convites,
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
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('welcome', {
    studentName,
    loginLink,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: studentEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.convites,
    });
  }
  
  // Fallback to default template
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
    from: EMAIL_SENDERS.convites,
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
  
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('session_reminder', {
    studentName,
    personalName,
    sessionDate: formattedDate,
    sessionTime: formattedTime,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: studentEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.avisos,
    });
  }

  // Fallback to default template
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
    from: EMAIL_SENDERS.avisos,
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
    from: EMAIL_SENDERS.cobranca,
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
    from: EMAIL_SENDERS.avisos,
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
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('password_reset', {
    studentName,
    code,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: studentEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.sistema,
    });
  }
  
  // Fallback to default template
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
    from: EMAIL_SENDERS.sistema,
  });
}


/**
 * Send purchase confirmation and activation email to new customer
 */
export async function sendPurchaseActivationEmail(
  customerEmail: string,
  customerName: string,
  planName: string,
  amount: number,
  activationLink: string
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
  
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('purchase_activation', {
    customerName: customerName || 'Personal',
    planName,
    amount: formattedAmount,
    activationLink,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: customerEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.cobranca,
    });
  }
  
  // Fallback to default template
  const subject = '🎉 Compra confirmada! Ative sua conta FitPrime';
  
  const formattedAmountFallback = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

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
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">🎉</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Compra Confirmada!</h1>
        <p style="color: #6b7280; margin: 10px 0 0; font-size: 16px;">Bem-vindo ao FitPrime</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${customerName || 'Personal'}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Sua compra foi processada com sucesso! Agora você tem acesso completo ao FitPrime, 
        a plataforma que vai revolucionar a forma como você gerencia seus alunos.
      </p>
      
      <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #166534; margin: 0 0 12px; font-size: 18px;">📋 Detalhes da Compra</h3>
        <p style="color: #166534; margin: 0; font-size: 16px;">
          <strong>Plano:</strong> ${planName}<br>
          <strong>Valor:</strong> ${formattedAmountFallback}/mês
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #4b5563; font-size: 14px; margin-bottom: 16px;">
          Clique no botão abaixo para ativar sua conta e começar a usar:
        </p>
        <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
          🚀 Ativar Minha Conta
        </a>
      </div>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>⚠️ Importante:</strong> Este link expira em 7 dias. Se você já tem uma conta, 
          basta fazer login normalmente que seu plano será ativado automaticamente.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
        <a href="${activationLink}" style="color: #10b981; word-break: break-all;">${activationLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <div style="text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
          Precisa de ajuda? Responda este email ou acesse nosso suporte.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          FitPrime - Gestão inteligente para Personal Trainers 💪
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${customerName || 'Personal'},

🎉 Sua compra foi confirmada!

Detalhes da Compra:
- Plano: ${planName}
- Valor: ${formattedAmount}/mês

Clique no link abaixo para ativar sua conta:
${activationLink}

⚠️ Este link expira em 7 dias.

Se você já tem uma conta, basta fazer login normalmente que seu plano será ativado automaticamente.

Precisa de ajuda? Responda este email.

FitPrime - Gestão inteligente para Personal Trainers 💪
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text,
    from: EMAIL_SENDERS.cobranca,
  });
}

/**
 * Send reminder email for pending activation
 */
export async function sendActivationReminderEmail(
  customerEmail: string,
  customerName: string,
  planName: string,
  activationLink: string,
  daysRemaining: number
): Promise<boolean> {
  const subject = `⏰ Sua conta FitPrime ainda não foi ativada - ${daysRemaining} dias restantes`;

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
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 28px;">⏰</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Não esqueça de ativar sua conta!</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${customerName || 'Personal'}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Notamos que você ainda não ativou sua conta do FitPrime. Seu plano <strong>${planName}</strong> 
        está pronto para uso - basta clicar no botão abaixo para começar!
      </p>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0;">
          ⚠️ Seu link expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ativar Minha Conta Agora
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Se você já ativou sua conta, ignore este email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${customerName || 'Personal'},

Notamos que você ainda não ativou sua conta do FitPrime.

⚠️ Seu link expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}

Clique no link abaixo para ativar:
${activationLink}

Se você já ativou sua conta, ignore este email.

FitPrime - Gestão inteligente para Personal Trainers 💪
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text,
    from: EMAIL_SENDERS.cobranca,
  });
}



/**
 * Send subscription confirmation email to existing user after purchase
 */
export async function sendSubscriptionConfirmationEmail(
  customerEmail: string,
  customerName: string,
  planName: string,
  amount: number,
  periodEnd: Date
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
  
  const formattedDate = periodEnd.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  
  // Try to get custom template from database
  const customTemplate = await getEmailTemplate('subscription_confirmation', {
    customerName: customerName || 'Personal',
    planName,
    amount: formattedAmount,
    periodEnd: formattedDate,
  });
  
  if (customTemplate) {
    const senderKey = customTemplate.senderType as keyof typeof EMAIL_SENDERS;
    return sendEmail({
      to: customerEmail,
      subject: customTemplate.subject,
      html: customTemplate.html,
      from: EMAIL_SENDERS[senderKey] || EMAIL_SENDERS.cobranca,
    });
  }
  
  // Fallback to default template
  const subject = 'Assinatura ativada com sucesso!';
  const displayName = customerName || 'Personal';

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
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">&#10004;</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Assinatura Ativada!</h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Ola <strong>${displayName}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Sua assinatura do <strong>${planName}</strong> foi ativada com sucesso! 
        Agora voce tem acesso a todos os recursos do seu plano.
      </p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">Detalhes da assinatura:</h3>
        <p style="color: #166534; margin: 4px 0; font-size: 14px;"><strong>Plano:</strong> ${planName}</p>
        <p style="color: #166534; margin: 4px 0; font-size: 14px;"><strong>Valor:</strong> ${formattedAmount}</p>
        <p style="color: #166534; margin: 4px 0; font-size: 14px;"><strong>Valido ate:</strong> ${formattedDate}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://fitprimemanager.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Acessar Dashboard
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Duvidas? Entre em contato conosco pelo email contato@fitprimemanager.online
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Ola ${displayName},

Sua assinatura do ${planName} foi ativada com sucesso!

Detalhes:
- Plano: ${planName}
- Valor: ${formattedAmount}
- Valido ate: ${formattedDate}

Acesse seu dashboard: https://fitprimemanager.com/dashboard

Duvidas? Entre em contato conosco pelo email contato@fitprimemanager.online
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text,
    from: EMAIL_SENDERS.cobranca,
  });
}


/**
 * Send trial expiring notification email
 */
export async function sendTrialExpiringEmail(
  email: string,
  name: string,
  hoursRemaining: number,
  upgradeLink: string
): Promise<boolean> {
  const isLastDay = hoursRemaining <= 24;
  const subject = isLastDay 
    ? '⚠️ Seu período de teste expira hoje!' 
    : `⏰ Seu período de teste expira em ${Math.ceil(hoursRemaining / 24)} dias`;
  
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
        <div style="width: 60px; height: 60px; background: ${isLastDay ? '#ef4444' : '#f59e0b'}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">${isLastDay ? '⚠️' : '⏰'}</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">
          ${isLastDay ? 'Último dia de teste!' : 'Seu teste está acabando'}
        </h1>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Olá <strong>${name}</strong>,
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${isLastDay 
          ? 'Seu período de teste gratuito do FitPrime <strong>expira hoje</strong>! Não perca acesso às funcionalidades que você já está usando.'
          : `Seu período de teste gratuito do FitPrime expira em <strong>${Math.ceil(hoursRemaining / 24)} dias</strong>. Aproveite para conhecer todas as funcionalidades!`
        }
      </p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">✅ O que você ganha ao assinar:</h3>
        <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Alunos ilimitados</li>
          <li>Geração de treinos com IA</li>
          <li>Cobranças automáticas</li>
          <li>Agenda completa</li>
          <li>Suporte prioritário</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${upgradeLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Assinar agora
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Tem dúvidas? Responda este email ou entre em contato pelo WhatsApp.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        FitPrime Manager - Sistema de Gestão para Personal Trainers
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    from: EMAIL_SENDERS.avisos,
  });
}

/**
 * Send conversion alert email to admin
 */
export async function sendConversionAlertEmail(
  adminEmail: string,
  customerName: string,
  customerEmail: string,
  productName: string,
  value: number,
  paymentMethod: string
): Promise<boolean> {
  const subject = `🎉 Nova venda: ${customerName} - R$ ${value.toFixed(2)}`;
  
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
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Nova Venda Confirmada!</h1>
      </div>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cliente:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produto:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pagamento:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${paymentMethod}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 0 0 0; color: #1f2937; font-size: 18px; font-weight: 700;">Valor:</td>
            <td style="padding: 12px 0 0 0; color: #10b981; font-size: 18px; font-weight: 700; text-align: right;">R$ ${value.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        FitPrime Manager - Sistema de Gestão para Personal Trainers
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html,
    from: EMAIL_SENDERS.sistema,
  });
}
