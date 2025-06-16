// Rate limiting utility for API endpoints
import { NextRequest } from 'next/server';
import { getClientIP } from './utils';
import type { RateLimitConfig, RateLimitData } from '@/types';

// In-memory storage for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitData>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 3600000) {
      // 1 hour cleanup
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Run every minute

export function rateLimit(config: RateLimitConfig) {
  return function checkRateLimit(request: NextRequest): {
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    message?: string;
  } {
    const ip = getClientIP(request);
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    let data = rateLimitStore.get(key);

    // Initialize or reset window if expired
    if (!data || now - data.windowStart >= config.windowMs) {
      data = {
        requests: 0,
        windowStart: now,
      };
    }

    data.requests++;
    rateLimitStore.set(key, data);

    const remaining = Math.max(0, config.maxRequests - data.requests);
    const reset = new Date(data.windowStart + config.windowMs);

    return {
      success: data.requests <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      reset,
      message: config.message || 'Rate limit exceeded. Please try again later.',
    };
  };
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 uploads per 15 minutes
    message: 'Too many uploads. Please wait before uploading more files.',
  },
  download: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 downloads per 5 minutes
    message: 'Too many download requests. Please wait a moment.',
  },
  password: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 password attempts per 15 minutes per IP
    message: 'Too many password attempts. Please wait before trying again.',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 API calls per 15 minutes
    message: 'Too many API requests. Please wait before making more requests.',
  },
};
