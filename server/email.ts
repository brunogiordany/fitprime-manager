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
  
  // If no API key, log to console (development mode)
  if (!apiKey) {
    console.log('[Email] Development mode - Email would be sent:');
    console.log(`  To: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Content: ${payload.text || payload.html.substring(0, 200)}...`);
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FitPrime <noreply@fitprime.app>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
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
