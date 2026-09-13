/**
 * LearnTrack Rate Limiter Module
 * 
 * Provides an architectural extension point for API rate limiting.
 * In development/test environments, uses an in-memory sliding token tracker.
 * In multi-region/serverless production, this interface can be backed by
 * an external distributed store such as Redis or Upstash without altering caller contracts.
 */

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

interface WindowBucket {
  count: number;
  resetTime: number;
}

const inMemoryBuckets = new Map<string, WindowBucket>();

/**
 * Checks whether an action keyed by identifier exceeds the configured request rate.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  let bucket = inMemoryBuckets.get(key);

  if (!bucket || now >= bucket.resetTime) {
    bucket = {
      count: 1,
      resetTime: now + windowMs,
    };
    inMemoryBuckets.set(key, bucket);

    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  bucket.count++;
  const remaining = Math.max(0, options.limit - bucket.count);
  const resetSeconds = Math.ceil(Math.max(0, bucket.resetTime - now) / 1000);

  if (bucket.count > options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    success: true,
    limit: options.limit,
    remaining,
    resetSeconds,
  };
}

/**
 * Generates standard rate-limiting headers for HTTP responses.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetSeconds.toString(),
  };
}

/**
 * Clears expired in-memory buckets (useful for test tear-down and periodic housekeeping).
 */
export function clearRateLimitBuckets(): void {
  inMemoryBuckets.clear();
}
