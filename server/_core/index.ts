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
import { getHealthStatus } from "./healthCheck";

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
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
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
  });
}

startServer().catch(console.error);
