import { describe, it, expect } from 'vitest';

describe('Resend API Integration', () => {
  it('should have Resend API key configured', async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiKey?.startsWith('re_')).toBe(true);
  });
  
  it('should send a test email successfully', { timeout: 15000 }, async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log('Skipping email test - no API key');
      return;
    }
    
    // Send a test email using Resend's test domain
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FitPrime <onboarding@resend.dev>',
        to: 'delivered@resend.dev', // Resend's test email address
        subject: 'FitPrime - Teste de Email',
        html: '<h1>Teste de Email</h1><p>Este é um email de teste do FitPrime.</p>',
      }),
    });
    
    const data = await response.json();
    console.log('Email response:', data);
    
    // Should return 200 with an id
    expect(response.ok).toBe(true);
    expect(data.id).toBeDefined();
  });
});
