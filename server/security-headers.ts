import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para adicionar headers de segurança que protegem contra:
 * - Clickjacking (X-Frame-Options)
 * - MIME type sniffing (X-Content-Type-Options)
 * - XSS attacks (X-XSS-Protection)
 * - Referrer leaking (Referrer-Policy)
 * - Acesso a recursos sensíveis (Content-Security-Policy)
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Bloquear iframe (previne clickjacking)
  res.setHeader('X-Frame-Options', 'DENY');

  // Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Ativa proteção XSS do navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Não enviar referrer para sites externos
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy - bloqueia inline scripts e recursos externos não autorizados
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Bloquear acesso a câmera, microfone, localização, etc.
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ')
  );

  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Bloquear acesso a informações sensíveis
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Desabilitar DNS prefetch
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  next();
}

/**
 * Middleware para bloquear acesso a rotas sensíveis via site: query
 * Retorna 403 Forbidden se a requisição vier de um search engine
 */
export function blockSearchEngineAccess(req: Request, res: Response, next: NextFunction) {
  const sensitiveRoutes = [
    '/quiz',
    '/quiz-2',
    '/checkout',
    '/admin',
    '/api',
    '/login',
    '/login-aluno',
    '/login-personal',
    '/cadastro-trial',
    '/ativar-conta',
    '/convite',
    '/portal',
    '/meu-portal',
    '/portal-aluno',
    '/dashboard',
  ];

  const isQuizRoute = sensitiveRoutes.some(route => req.path.startsWith(route));
  const userAgent = req.headers['user-agent'] || '';

  // Detectar bots de search engine
  const isSearchBot =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebookexternalhit/i.test(
      userAgent
    );

  if (isQuizRoute && isSearchBot) {
    res.status(403).send('Forbidden');
    return;
  }

  next();
}

/**
 * Middleware para adicionar headers anti-cache em rotas sensíveis
 */
export function noCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const sensitiveRoutes = ['/quiz', '/quiz-2', '/checkout', '/admin', '/api'];

  const isSensitiveRoute = sensitiveRoutes.some(route => req.path.startsWith(route));

  if (isSensitiveRoute) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}
