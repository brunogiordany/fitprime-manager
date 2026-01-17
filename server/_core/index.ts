import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import multer from "multer";
import { nanoid } from "nanoid";
import { handleStripeWebhook } from "../stripe/webhook";
import { handleCaktoWebhook } from "../cakto/webhook";
import { handlePaytWebhook } from "../payt/webhook";
import { getHealthStatus } from "./healthCheck";
import { securityHeaders, blockSearchEngineAccess, noCacheHeaders } from "../security-headers";
import { startAutomationWorker } from "../automationWorker";
import { startEmailWorker } from "../workers/emailWorker";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook - MUST be before body parser to preserve raw body for signature verification
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Cakto webhook - receives payment events from Cakto platform
  app.post('/api/cakto/webhook', express.json(), handleCaktoWebhook);
  
  // Payt webhook - receives payment events from Payt platform (afiliados e influenciadores)
  app.post('/api/payt/webhook', express.json(), handlePaytWebhook);
  
  // Stevo webhook - receives WhatsApp messages
  app.post('/api/webhook/stevo', express.json(), async (req: any, res: any) => {
    console.log('[Stevo Webhook] Recebido payload:', JSON.stringify(req.body, null, 2));
    try {
      const { handleStevoWebhook } = await import('../stevo');
      const result = await handleStevoWebhook(req.body);
      console.log('[Stevo Webhook] Resultado:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error: any) {
      console.error('[Stevo Webhook] Error:', error);
      res.status(500).json({ error: error?.message || 'Internal error' });
    }
  });
  
  // Evolution API webhook - receives WhatsApp messages (alternative to Stevo)
  app.post('/api/webhook/evolution', express.json(), async (req: any, res: any) => {
    console.log('[Evolution Webhook] Recebido payload:', JSON.stringify(req.body, null, 2));
    
    // Verificar header de segurança
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== 'fitprime-evolution-secret-2024') {
      console.log('[Evolution Webhook] API key inválida:', apiKey);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const { handleEvolutionWebhook } = await import('../evolution');
      const result = await handleEvolutionWebhook(req.body);
      console.log('[Evolution Webhook] Resultado:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error: any) {
      console.error('[Evolution Webhook] Error:', error);
      res.status(500).json({ error: error?.message || 'Internal error' });
    }
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Adicionar middlewares de segurança
  app.use(securityHeaders);
  app.use(blockSearchEngineAccess);
  app.use(noCacheHeaders);
  
  // File upload endpoint
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post('/api/upload', upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      const fileKey = `uploads/${nanoid()}/${req.file.originalname}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      res.json({ url, fileKey });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
  
  // Bioimpedância upload endpoint with AI analysis
  app.post('/api/upload/bioimpedance', upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      }
      
      // Validate file size
      const isPdf = req.file.mimetype === 'application/pdf';
      const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: `Arquivo muito grande. Máximo: ${isPdf ? '10MB' : '5MB'}` });
      }
      
      // Upload to S3
      const fileKey = `bioimpedance/${nanoid()}/${req.file.originalname}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      
      // Analyze with AI
      let aiAnalysis = null;
      let extractedData = null;
      
      try {
        const { invokeLLM } = await import('./llm');
        
        const content: any[] = [
          {
            type: 'text',
            text: `Analise este exame de bioimpedância e extraia os seguintes dados:
- Percentual de gordura corporal (%)
- Massa muscular (kg)
- Massa gorda (kg)
- Gordura visceral (nível)
- Metabolismo basal (kcal)

Retorne um JSON com os campos: bodyFat, muscleMass, fatMass, visceralFat, basalMetabolism.
Além disso, forneça uma análise resumida dos resultados em português.

Formato de resposta:
{"extractedData": {...}, "analysis": "..."}`
          }
        ];
        
        // Add file content based on type
        if (isPdf) {
          content.push({
            type: 'file_url',
            file_url: {
              url: url,
              mime_type: 'application/pdf'
            }
          });
        } else {
          content.push({
            type: 'image_url',
            image_url: {
              url: url,
              detail: 'high'
            }
          });
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de exames de bioimpedância. Extraia os dados numéricos e forneça uma análise profissional dos resultados. Sempre responda em JSON válido.'
            },
            {
              role: 'user',
              content: content
            }
          ]
        });
        
        const responseText = response.choices?.[0]?.message?.content || '';
        
        // Try to parse JSON from response
        try {
          const textContent = typeof responseText === 'string' ? responseText : '';
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            extractedData = parsed.extractedData || null;
            aiAnalysis = parsed.analysis || responseText;
          } else {
            aiAnalysis = responseText;
          }
        } catch (parseError) {
          aiAnalysis = responseText;
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Continue without AI analysis
      }
      
      res.json({ 
        url, 
        key: fileKey, 
        aiAnalysis, 
        extractedData 
      });
    } catch (error) {
      console.error('Bioimpedance upload error:', error);
      res.status(500).json({ error: 'Erro no upload' });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', async (req: any, res: any) => {
    try {
      const health = await getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error: any) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error?.message || 'Health check failed'
      });
    }
  });
  
  // ==================== EMAIL TRACKING ROUTES ====================
  
  // Pixel de rastreamento de abertura de email (1x1 transparent GIF)
  app.get('/api/email/track/open/:emailSendId', async (req: any, res: any) => {
    try {
      const emailSendId = parseInt(req.params.emailSendId);
      if (isNaN(emailSendId)) {
        // Return transparent pixel anyway to not break email
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.set('Content-Type', 'image/gif');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res.send(pixel);
      }
      
      // Record the open event
      const { getDb } = await import('../db');
      const { emailTracking, emailSends } = await import('../../drizzle/schema');
      const db = await getDb();
      
      if (db) {
        // Check if email exists
        const { eq } = await import('drizzle-orm');
        const [emailSend] = await db.select().from(emailSends).where(eq(emailSends.id, emailSendId));
        
        if (emailSend) {
          await db.insert(emailTracking).values({
            emailSendId,
            eventType: 'open',
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
          });
          console.log(`[EmailTracking] Open recorded for email ${emailSendId}`);
        }
      }
      
      // Return transparent 1x1 GIF pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.send(pixel);
    } catch (error) {
      console.error('[EmailTracking] Open error:', error);
      // Return pixel anyway
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.send(pixel);
    }
  });
  
  // Redirect de rastreamento de clique em link
  app.get('/api/email/track/click/:emailSendId', async (req: any, res: any) => {
    try {
      const emailSendId = parseInt(req.params.emailSendId);
      const targetUrl = req.query.url as string;
      
      if (!targetUrl) {
        return res.status(400).send('Missing target URL');
      }
      
      // Decode the URL
      const decodedUrl = decodeURIComponent(targetUrl);
      
      if (!isNaN(emailSendId)) {
        // Record the click event
        const { getDb } = await import('../db');
        const { emailTracking, emailSends } = await import('../../drizzle/schema');
        const db = await getDb();
        
        if (db) {
          const { eq } = await import('drizzle-orm');
          const [emailSend] = await db.select().from(emailSends).where(eq(emailSends.id, emailSendId));
          
          if (emailSend) {
            await db.insert(emailTracking).values({
              emailSendId,
              eventType: 'click',
              linkUrl: decodedUrl,
              ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
              userAgent: req.headers['user-agent'] || '',
            });
            console.log(`[EmailTracking] Click recorded for email ${emailSendId}: ${decodedUrl}`);
          }
        }
      }
      
      // Redirect to the target URL
      res.redirect(302, decodedUrl);
    } catch (error) {
      console.error('[EmailTracking] Click error:', error);
      // Try to redirect anyway
      const targetUrl = req.query.url as string;
      if (targetUrl) {
        res.redirect(302, decodeURIComponent(targetUrl));
      } else {
        res.status(500).send('Error processing click');
      }
    }
  });
  
  // Unsubscribe endpoint
  app.get('/api/email/unsubscribe', async (req: any, res: any) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).send('Email não fornecido');
      }
      
      const { getDb } = await import('../db');
      const { leadEmailSubscriptions } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      
      if (db) {
        // Check if subscription exists
        const [existing] = await db.select().from(leadEmailSubscriptions).where(eq(leadEmailSubscriptions.leadEmail, email));
        
        if (existing) {
          await db.update(leadEmailSubscriptions)
            .set({ isSubscribed: false, unsubscribedAt: new Date() })
            .where(eq(leadEmailSubscriptions.leadEmail, email));
        } else {
          await db.insert(leadEmailSubscriptions).values({
            leadEmail: email,
            isSubscribed: false,
            unsubscribedAt: new Date(),
          });
        }
        
        console.log(`[EmailTracking] Unsubscribed: ${email}`);
      }
      
      // Return a simple confirmation page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inscrição Cancelada</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #10b981; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>✓ Inscrição Cancelada</h1>
          <p>Você foi removido da nossa lista de emails.</p>
          <p>Não enviaremos mais emails para ${email}.</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('[EmailTracking] Unsubscribe error:', error);
      res.status(500).send('Erro ao processar solicitação');
    }
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Iniciar worker de automações WhatsApp (executa a cada 15 minutos)
    startAutomationWorker(15);
    
    // Iniciar worker de emails para leads (executa a cada 5 minutos)
    startEmailWorker();
  });
}

startServer().catch(console.error);
