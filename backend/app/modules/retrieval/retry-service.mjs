import { setTimeout as delay } from "node:timers/promises";

export async function withRetry(operation, {
  retries = 2,
  delayMs = 50,
  backoffFactor = 2,
  onRetry,
} = {}) {
  let attempt = 0;
  let currentDelay = Math.max(0, delayMs);

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retries) throw error;
      attempt += 1;
      if (onRetry) {
        await onRetry({
          attempt,
          remaining: retries - attempt,
          error,
        });
      }
      if (currentDelay > 0) {
        await delay(currentDelay);
      }
      currentDelay = Math.ceil(currentDelay * backoffFactor);
    }
  }
}
