/**
 * OpenRouter Queue & Rate Limiter
 * 
 * Mengatur antrian pemanggilan ke OpenRouter (terutama model free seperti nvidia/nemotron-3.5-super-vl:free):
 * - Batas RPM: 39 Requests Per Minute (pacing ~1550ms antar-request)
 * - Batas RPD: 995 Requests Per Day
 * - Auto-reset RPD & TPD (Tokens Per Day) setiap pergantian hari UTC (00:00 UTC)
 * - Method manual resetDailyStats() untuk mereset TPD dan RPD ke 0 kapan saja
 * - Penanganan antrian FIFO otomatis dan retry terukur saat terkena 429
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface QueueTask<T = any> {
  id: string;
  model: string;
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
  retries: number;
  maxRetries: number;
}

export interface OpenRouterStats {
  rpmLimit: number;
  currentRPM: number;
  rpdLimit: number;
  dailyRequests: number;
  dailyTokens: number;
  currentDayUTC: string;
  queueLength: number;
  isProcessing: boolean;
  lastResetAt: string;
}

export class OpenRouterQueue {
  private readonly MAX_RPM = 39;
  private readonly MAX_RPD = 995;
  private readonly MIN_PACING_MS = 1550; // Jeda aman antar-request (60.000ms / 39 = 1.538ms)
  private readonly MIN_PAID_PACING_MS = 200; // Pacing minimal untuk model berbayar

  private queue: QueueTask[] = [];
  private isProcessing = false;
  private requestTimestamps: number[] = [];
  private lastRequestTime = 0;

  // Daily statistics
  private dailyRequests = 0;
  private dailyTokens = 0;
  private lastResetDate = this.getTodayDateUTC();
  private lastResetTimestamp = Date.now();

  constructor() {
    console.log(`[OpenRouter Queue] Diinisialisasi. Limit: ${this.MAX_RPM} RPM, ${this.MAX_RPD} RPD. Tanggal UTC: ${this.lastResetDate}`);
  }

  private getTodayDateUTC(): string {
    return new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  }

  /**
   * Cek apakah hari sudah berganti, jika ya reset TPD dan RPD ke 0
   */
  private checkDailyReset() {
    const today = this.getTodayDateUTC();
    if (this.lastResetDate !== today) {
      console.log(`[OpenRouter Queue] Pergantian hari terdeteksi (${this.lastResetDate} -> ${today}). Mereset RPD dan TPD ke 0.`);
      this.resetDailyStats();
      this.lastResetDate = today;
    }
  }

  /**
   * Reset manual TPD dan RPD ke 0
   */
  public resetDailyStats(): OpenRouterStats {
    this.dailyRequests = 0;
    this.dailyTokens = 0;
    this.lastResetDate = this.getTodayDateUTC();
    this.lastResetTimestamp = Date.now();
    this.requestTimestamps = [];
    console.log(`[OpenRouter Queue] Berhasil: TPD dan RPD OpenRouter telah direset ke 0.`);
    return this.getStats();
  }

  /**
   * Mengambil status antrian dan penggunaan kuota saat ini
   */
  public getStats(): OpenRouterStats {
    this.checkDailyReset();
    const now = Date.now();
    // Prune timestamps older than 60s
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);

    return {
      rpmLimit: this.MAX_RPM,
      currentRPM: this.requestTimestamps.length,
      rpdLimit: this.MAX_RPD,
      dailyRequests: this.dailyRequests,
      dailyTokens: this.dailyTokens,
      currentDayUTC: this.lastResetDate,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      lastResetAt: new Date(this.lastResetTimestamp).toISOString(),
    };
  }

  /**
   * Tambahkan request ke antrian
   */
  public executeRequest<T = any>(
    model: string,
    fn: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    this.checkDailyReset();

    const isFreeModel = model.includes(":free");

    // Jika model free dan sudah mencapai batas harian RPD 995, langsung lempar error agar fallback ke non-free
    if (isFreeModel && this.dailyRequests >= this.MAX_RPD) {
      console.warn(`[OpenRouter Queue] Batas harian RPD ${this.MAX_RPD} untuk ${model} telah tercapai hari ini (${this.lastResetDate}).`);
      return Promise.reject(
        new Error(`[OpenRouter Queue] Batas harian ${this.MAX_RPD} RPD untuk ${model} telah tercapai. Harap gunakan model alternatif.`)
      );
    }

    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = {
        id: `or_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        model,
        fn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        retries: 0,
        maxRetries,
      };

      this.queue.push(task);
      console.log(`[OpenRouter Queue] Request [${task.id}] untuk (${model}) masuk antrian. Panjang antrian: ${this.queue.length}`);
      this.processQueue();
    });
  }

  /**
   * Worker loop pemrosesan antrian
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue[0];
      const isFreeModel = task.model.includes(":free");

      this.checkDailyReset();

      // Cek limit RPD harian untuk model free
      if (isFreeModel && this.dailyRequests >= this.MAX_RPD) {
        this.queue.shift();
        task.reject(
          new Error(`[OpenRouter Queue] Batas harian ${this.MAX_RPD} RPD untuk ${task.model} tercapai saat di antrian.`)
        );
        continue;
      }

      // Atur pacing dan RPM
      const now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);

      if (isFreeModel) {
        // Jika sudah mencapai batas 39 RPM dalam 60 detik terakhir
        if (this.requestTimestamps.length >= this.MAX_RPM) {
          const oldest = this.requestTimestamps[0];
          const waitMs = Math.max(50, 60000 - (now - oldest) + 100);
          console.warn(`[OpenRouter Queue] RPM mencapai batas (${this.requestTimestamps.length}/${this.MAX_RPM}). Menahan antrian selama ${waitMs}ms...`);
          await delay(waitMs);
          continue; // Loop kembali untuk cek ulang kondisi setelah jeda
        }

        // Pacing minimal antar-request (~1550ms)
        const elapsedSinceLast = now - this.lastRequestTime;
        if (elapsedSinceLast < this.MIN_PACING_MS) {
          const pacingWait = this.MIN_PACING_MS - elapsedSinceLast;
          await delay(pacingWait);
        }
      } else {
        // Model berbayar (non-free) menggunakan pacing santai 200ms
        const elapsedSinceLast = now - this.lastRequestTime;
        if (elapsedSinceLast < this.MIN_PAID_PACING_MS) {
          await delay(this.MIN_PAID_PACING_MS - elapsedSinceLast);
        }
      }

      this.lastRequestTime = Date.now();

      try {
        console.log(`[OpenRouter Queue] Menjalankan request [${task.id}] (${task.model}). Antrian tersisa: ${this.queue.length - 1}`);
        const result = await task.fn();

        // Jika result adalah Fetch Response, periksa apakah 429
        if (result && typeof (result as any).status === "number") {
          const res = result as any as Response;
          if (res.status === 429) {
            console.warn(`[OpenRouter Queue] Model ${task.model} menerima status 429 (Rate Limit Upstream).`);
            if (task.retries < task.maxRetries) {
              task.retries++;
              console.log(`[OpenRouter Queue] Menunggu 3 detik sebelum retry (${task.retries}/${task.maxRetries})...`);
              await delay(3000);
              // Lanjutkan eksekusi task ini kembali
              continue;
            }
          }

          // Catat statistik jika response sukses
          if (res.ok) {
            this.requestTimestamps.push(Date.now());
            if (isFreeModel) {
              this.dailyRequests++;
            }
            // Tangkap token usage jika ada tanpa mengganggu stream caller
            try {
              const cloned = res.clone();
              cloned.json().then((body) => {
                const tokens = body?.usage?.total_tokens;
                if (typeof tokens === "number") {
                  this.dailyTokens += tokens;
                }
              }).catch(() => {});
            } catch {
              // Ignore clone error
            }
          }
        } else {
          // Non-response result
          this.requestTimestamps.push(Date.now());
          if (isFreeModel) {
            this.dailyRequests++;
          }
        }

        // Berhasil, keluarkan dari antrian dan resolve
        this.queue.shift();
        task.resolve(result);
      } catch (err: any) {
        console.warn(`[OpenRouter Queue] Request [${task.id}] gagal:`, err?.message || err);
        if (task.retries < task.maxRetries && (err?.message?.includes("429") || err?.message?.includes("rate"))) {
          task.retries++;
          console.log(`[OpenRouter Queue] Menunggu 3 detik dan retry task [${task.id}]...`);
          await delay(3000);
          continue;
        }

        // Selesai dengan error
        this.queue.shift();
        task.reject(err);
      }
    }

    this.isProcessing = false;
  }
}

export const openRouterQueue = new OpenRouterQueue();
