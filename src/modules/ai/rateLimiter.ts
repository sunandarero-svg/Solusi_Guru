const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class TokenBucket {
  tokens: number;
  lastRefill: number;
  readonly capacity: number;
  readonly fillPerSecond: number;

  constructor(capacity: number, fillPerSecond: number) {
    this.capacity = capacity;
    this.fillPerSecond = fillPerSecond;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    const addedTokens = elapsedSeconds * this.fillPerSecond;
    
    this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
    this.lastRefill = now;
  }

  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

class GroqRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private cooldowns: Map<string, number> = new Map(); // key -> expiration timestamp
  private keys: string[] = [];

  constructor() {
    this.initKeys();
  }

  private initKeys() {
    const keysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
    if (!keysStr) return;

    this.keys = keysStr
      .replace(/[\r\n]/g, "")
      .split(",")
      .map((k) => k.replace(/['"` ]/g, "").trim())
      .filter((k) => k.length > 5);

    for (const key of this.keys) {
      // 30 RPM = 0.5 tokens per second. We set capacity to 30.
      if (!this.buckets.has(key)) {
        this.buckets.set(key, new TokenBucket(30, 0.5));
      }
    }
  }

  public getKeys(): string[] {
    if (this.keys.length === 0) {
      this.initKeys();
    }
    return this.keys;
  }

  public setCooldown(key: string, seconds: number = 60) {
    this.cooldowns.set(key, Date.now() + seconds * 1000);
    console.warn(`[RateLimiter] Key ${key.substring(0, 8)} is on cooldown for ${seconds}s`);
  }

  public isKeyOnCooldown(key: string): boolean {
    const expiry = this.cooldowns.get(key);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.cooldowns.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Tries to acquire a key. Returns null if all keys are exhausted or on cooldown.
   */
  public tryAcquireKey(): { key: string; index: number } | null {
    if (this.keys.length === 0) this.initKeys();
    if (this.keys.length === 0) return null;

    let bestKey: string | null = null;
    let bestTokens = -1;
    let bestIndex = -1;

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      if (this.isKeyOnCooldown(key)) continue;

      const bucket = this.buckets.get(key);
      if (bucket) {
        const tokens = bucket.getTokens();
        if (tokens > bestTokens && tokens >= 1) {
          bestTokens = tokens;
          bestKey = key;
          bestIndex = i;
        }
      }
    }

    if (bestKey && bestTokens >= 1) {
      const bucket = this.buckets.get(bestKey);
      if (bucket && bucket.tryConsume()) {
        return { key: bestKey, index: bestIndex };
      }
    }

    return null;
  }

  /**
   * Waits until a key becomes available.
   */
  public async waitForKey(timeoutMs: number = 60000): Promise<{ key: string; index: number }> {
    if (this.keys.length === 0) this.initKeys();
    if (this.keys.length === 0) throw new Error("GROQ_API_KEY is not configured.");

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const result = this.tryAcquireKey();
      if (result) {
        return result;
      }
      
      // If all keys are exhausted or on cooldown, wait a bit before retrying
      // Since refill rate is 0.5 per sec, waiting 2 seconds guarantees at least 1 token is generated for each key (if not capped)
      await delay(2000); 
    }

    throw new Error(`Timeout waiting for available Groq API key after ${timeoutMs}ms. All keys might be rate limited.`);
  }

  /**
   * Check if ALL keys are currently on cooldown
   */
  public areAllKeysExhausted(): boolean {
    if (this.keys.length === 0) return true;
    for (const key of this.keys) {
      if (!this.isKeyOnCooldown(key)) return false;
    }
    return true;
  }
}

export const groqRateLimiter = new GroqRateLimiter();
