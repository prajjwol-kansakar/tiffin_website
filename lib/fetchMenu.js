const MAX_MENU_ATTEMPTS = 6;
const MENU_RETRY_DELAY_MS = 10_000;

function waitForRetry(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The menu request was aborted.", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, MENU_RETRY_DELAY_MS);

    const abort = () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("The menu request was aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function fetchMenuWithRetry(url, { signal, onFailure } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_MENU_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { signal });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error("Could not load the menu.");
      }

      return data;
    } catch (error) {
      if (signal?.aborted) throw error;

      lastError = error;
      onFailure?.();
      if (attempt < MAX_MENU_ATTEMPTS) await waitForRetry(signal);
    }
  }

  throw lastError;
}
