import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook endpoint for TikTok Shop
 * POST /api/webhooks/tiktok-shop
 * GET /api/webhooks/tiktok-shop (health check)
 */

// Environment variables
const TIKTOK_SHOP_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || '';
const TIKTOK_SHOP_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || '';
const TIKTOK_SHOP_WEBHOOK_SECRET = process.env.TIKTOK_SHOP_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Supabase client (service role p/ bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers (if needed for testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'tiktok-shop-webhook',
      timestamp: new Date().toISOString(),
      configured: {
        appKey: !!TIKTOK_SHOP_APP_KEY,
        appSecret: !!TIKTOK_SHOP_APP_SECRET,
        webhookSecret: !!TIKTOK_SHOP_WEBHOOK_SECRET,
        supabase: !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  }

  // POST: Webhook handler
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Extrai campos do payload
      const eventType = body.type || body.event_type || 'UNKNOWN';
      const shopId = body.shop_id || body.data?.shop_id || 'UNKNOWN';
      const orderId = body.data?.order_id || null;
      const productId = body.data?.product_id || null;

      console.log('📥 TikTok webhook:', {
        eventType,
        shopId,
        orderId,
        productId,
        timestamp: new Date().toISOString(),
      });

      // Salva no Supabase
      const { error } = await supabase
        .from('tiktok_webhook_events')
        .insert({
          event_type: eventType,
          shop_id: shopId,
          order_id: orderId,
          product_id: productId,
          raw_payload: body,
          processed: false,
        });

      if (error) {
        console.error('❌ Supabase insert error:', error);
        // Ainda responde 200 p/ evitar retry infinito
      }

      // Responde rápido
      return res.status(200).json({
        success: true,
        received: true,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      
      // Sempre 200 p/ evitar retry TikTok
      return res.status(200).json({
        success: false,
        error: 'Internal processing error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'POST'],
  });
}
