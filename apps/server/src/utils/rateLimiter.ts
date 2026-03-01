import { logger } from './logger';

/**
 * Simple in-memory rate limiter
 * 
 * Tracks requests by IP address and enforces rate limits.
 * For production, consider using Redis for distributed rate limiting.
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   * @param key - Identifier (e.g., IP address)
   * @returns true if allowed, false if rate limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter out old requests outside the window
    const recentTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);

    if (recentTimestamps.length >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { key, requests: recentTimestamps.length, limit: this.maxRequests });
      return false;
    }

    // Add current request
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);

    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const recentTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - recentTimestamps.length);
  }

  /**
   * Get reset time for a key (in milliseconds)
   */
  getResetTime(key: string): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;

    const oldestTimestamp = Math.min(...timestamps);
    return oldestTimestamp + this.windowMs;
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamps] of this.requests.entries()) {
      const recentTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);
      
      if (recentTimestamps.length === 0) {
        this.requests.delete(key);
        cleaned++;
      } else if (recentTimestamps.length < timestamps.length) {
        this.requests.set(key, recentTimestamps);
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', { entriesRemoved: cleaned, totalEntries: this.requests.size });
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Translation endpoints rate limiter: max 5 requests per hour
export const translationRateLimiter = new RateLimiter(
  60 * 60 * 1000, // 1 hour
  5 // Max 5 requests per hour
);

/**
 * Get client IP from request
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to unknown (in dev mode this is common)
  return 'unknown';
}
