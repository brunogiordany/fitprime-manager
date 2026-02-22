/**
 * Meta Conversions API (CAPI) - Server-Side Event Handler
 * 
 * Envia eventos deduplicados para o Facebook via Conversions API.
 * Otimizado para nota máxima no Gerenciador de Eventos:
 * - event_id para deduplicação com Pixel client-side
 * - fbp/fbc para matching de usuários
 * - user_agent + client_ip_address para qualidade de match
 * - action_source = 'website'
 */

import type { Request, Response } from 'express';
import crypto from 'crypto';

const PIXEL_ID = '898343203142628';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const API_VERSION = 'v21.0';
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

interface CAPIEventPayload {
  event_name: string;
  event_id: string;
  event_source_url: string;
  fbp: string | null;
  fbc: string | null;
  user_agent: string;
  lp_slug: string;
  utms: Record<string, string>;
  custom_data: Record<string, any>;
}

function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '0.0.0.0';
}

export async function handleMetaCAPIEvent(req: Request, res: Response) {
  try {
    const payload: CAPIEventPayload = req.body;
    
    if (!payload.event_name || !payload.event_id) {
      return res.status(400).json({ error: 'event_name and event_id are required' });
    }

    if (!ACCESS_TOKEN) {
      console.warn('[CAPI] META_ACCESS_TOKEN not configured, skipping server event');
      return res.json({ success: false, reason: 'no_token' });
    }

    const clientIP = getClientIP(req);
    const userAgent = payload.user_agent || req.headers['user-agent'] || '';
    const eventTime = Math.floor(Date.now() / 1000);

    // Build user_data com parâmetros para nota máxima
    const userData: Record<string, any> = {
      client_ip_address: clientIP,
      client_user_agent: userAgent,
    };

    // fbp e fbc são críticos para matching de usuários
    if (payload.fbp) {
      userData.fbp = payload.fbp;
    }
    if (payload.fbc) {
      userData.fbc = payload.fbc;
    }

    // Build custom_data
    const customData: Record<string, any> = { ...payload.custom_data };
    
    // Adicionar UTMs como custom properties
    if (payload.utms && Object.keys(payload.utms).length > 0) {
      Object.entries(payload.utms).forEach(([key, value]) => {
        customData[key] = value;
      });
    }

    // Adicionar LP slug como custom property
    if (payload.lp_slug) {
      customData.content_category = customData.content_category || payload.lp_slug;
    }

    // Build evento CAPI
    const eventData: Record<string, any> = {
      event_name: payload.event_name,
      event_time: eventTime,
      event_id: payload.event_id, // Mesmo ID do Pixel para deduplicação
      event_source_url: payload.event_source_url,
      action_source: 'website',
      user_data: userData,
    };

    // Só adicionar custom_data se tiver conteúdo
    if (Object.keys(customData).length > 0) {
      eventData.custom_data = customData;
    }

    // Enviar para Graph API
    const body = JSON.stringify({
      data: [eventData],
      access_token: ACCESS_TOKEN,
    });

    const response = await fetch(GRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[CAPI] Facebook API error:', JSON.stringify(result));
      return res.status(response.status).json({ success: false, error: result });
    }

    console.log(`[CAPI] ${payload.event_name} sent (event_id: ${payload.event_id}, ip: ${clientIP}, fbp: ${payload.fbp ? 'yes' : 'no'}, fbc: ${payload.fbc ? 'yes' : 'no'})`);
    
    return res.json({ success: true, events_received: result.events_received });
  } catch (error: any) {
    console.error('[CAPI] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
