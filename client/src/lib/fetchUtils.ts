/**
 * Fetch utilities with timeout and retry support
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

interface FetchWithRetryOptions extends FetchWithTimeoutOptions {
  retries?: number;
  retryDelay?: number;
  retryOn?: (response: Response) => boolean;
}

/**
 * Fetch with timeout support
 * Automatically aborts request if it takes longer than timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry support
 * Automatically retries failed requests with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = RETRY_DELAY_BASE,
    retryOn = (response: Response) => response.status >= 500,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions);

      // Check if we should retry based on response
      if (attempt < retries && retryOn(response)) {
        const delay = retryDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on timeout for last attempt
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe JSON fetch with timeout, retry, and error handling
 */
export async function safeFetch<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<{ data: T | null; error: Error | null; response: Response | null }> {
  try {
    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        data: null,
        error: new Error(`HTTP ${response.status}: ${errorText}`),
        response,
      };
    }

    const data = await response.json();
    return { data, error: null, response };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      response: null,
    };
  }
}
