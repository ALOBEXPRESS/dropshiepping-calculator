import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * Webhook endpoint for TikTok Shop
 * POST /api/webhooks/tiktok-shop
 * GET /api/webhooks/tiktok-shop (health check)
 */

// Environment variables
const TIKTOK_SHOP_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || '';
const TIKTOK_SHOP_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || '';
const TIKTOK_SHOP_WEBHOOK_SECRET = process.env.TIKTOK_SHOP_WEBHOOK_SECRET || '';

/**
 * Validates TikTok Shop webhook signature
 * @param body - Raw request body as string
 * @param signature - Authorization header value
 * @returns boolean indicating if signature is valid
 */
function validateTikTokSignature(body: string, signature: string): boolean {
  if (!TIKTOK_SHOP_WEBHOOK_SECRET) {
    console.warn('⚠️ TIKTOK_SHOP_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    // TikTok Shop typically uses HMAC-SHA256 for webhook signatures
    const hmac = crypto.createHmac('sha256', TIKTOK_SHOP_WEBHOOK_SECRET);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures (timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('❌ Error validating signature:', error);
    return false;
  }
}

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
      },
    });
  }

  // POST: Webhook handler
  if (req.method === 'POST') {
    try {
      // Get raw body as string for signature validation
      const rawBody = JSON.stringify(req.body);
      const authHeader = req.headers.authorization || '';

      console.log('📥 TikTok Shop Webhook received:', {
        timestamp: new Date().toISOString(),
        headers: {
          contentType: req.headers['content-type'],
          authorization: authHeader ? '***' : 'missing',
        },
        bodyPreview: rawBody.substring(0, 200),
      });

      // Signature validation (commented out for initial testing)
      // Uncomment when ready to enforce signature validation
      /*
      if (!validateTikTokSignature(rawBody, authHeader)) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({
          error: 'Invalid signature',
          message: 'Webhook signature validation failed',
        });
      }
      */

      // Log the full event for debugging
      console.log('📦 TikTok Shop Event:', JSON.stringify(req.body, null, 2));

      // TODO: Process the webhook event here
      // Example: Save to database, trigger workflows, etc.
      
      // Respond quickly to TikTok Shop (they expect fast responses)
      return res.status(200).json({
        success: true,
        received: true,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Error processing TikTok Shop webhook:', error);
      
      // Still return 200 to prevent TikTok from retrying
      // Log the error for investigation
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
