import { submissionService } from "@/modules/submission/submissionService";
import { aiService } from "@/modules/ai/aiService";

/**
 * Simple in-memory concurrency limiter.
 * Ensures at most MAX_CONCURRENT AI processing tasks run simultaneously.
 * Additional tasks are queued and processed in FIFO order.
 */
const MAX_CONCURRENT = 5;
let activeCount = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeCount < MAX_CONCURRENT) {
      activeCount++;
      resolve();
    } else {
      waitQueue.push(() => {
        activeCount++;
        resolve();
      });
    }
  });
}

function releaseSlot() {
  activeCount--;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift()!;
    next();
  }
}

/** Returns the current queue status for monitoring */
export function getQueueStatus() {
  return {
    active: activeCount,
    waiting: waitQueue.length,
    maxConcurrent: MAX_CONCURRENT,
  };
}

/**
 * Background worker to process submission asynchronously.
 * Uses a concurrency limiter to prevent OOM and API rate limit issues
 * when many students submit simultaneously.
 */
export const processingWorker = {
  async processSubmissionPipeline(submissionId: string, options?: { forceProvider?: string }) {
    // Wait for an available slot (queues if all slots are busy)
    const queuePosition = waitQueue.length;
    if (activeCount >= MAX_CONCURRENT) {
      console.log(`[Worker] Submission ${submissionId} queued at position ${queuePosition + 1}. Active: ${activeCount}/${MAX_CONCURRENT}`);
    }

    await acquireSlot();

    try {
      console.log(`[Worker] Processing submission: ${submissionId} (Active: ${activeCount}/${MAX_CONCURRENT}, Waiting: ${waitQueue.length})`);

      // 1. Mark as processing
      await submissionService.updateStatus(submissionId, "PROCESSING");
      
      // 2. Process AI Assessment directly with Multimodal (Gemini)
      await aiService.assessSubmission(submissionId, options);
      
      // 3. Mark as ready for teacher
      await submissionService.updateStatus(submissionId, "NEEDS_TEACHER_REVIEW");
      
      console.log(`[Worker] Successfully processed submission: ${submissionId}`);
    } catch (error) {
      console.error(`[Worker] Failed to process submission ${submissionId}:`, error);
      // Mark as failed so teacher/admin knows it didn't complete
      await submissionService.updateStatus(submissionId, "FAILED");
    } finally {
      releaseSlot();
    }
  }
};
