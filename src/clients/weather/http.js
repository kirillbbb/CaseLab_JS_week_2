import { AppError } from "../../errors/AppError.js";

export async function requestJson(url, options = {}) {
  const {
    timeoutMs,
    fetchImpl = fetch,
    method = "GET",
    headers = {
      accept: "application/json",
    },
  } = options;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method,
      headers,
      signal: controller.signal,
    });

    const body = await response.text();

    if (!response.ok) {
      throw new AppError(
        503,
        "WEATHER_API_ERROR",
        `Weather API returned status ${response.status}`,
        [],
      );
    }

    try {
      return body ? JSON.parse(body) : null;
    } catch {
      throw new AppError(
        503,
        "WEATHER_API_INVALID_RESPONSE",
        "Weather API returned invalid JSON",
        [],
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new AppError(
        503,
        "WEATHER_API_TIMEOUT",
        "Weather API request timed out",
        [],
      );
    }

    throw new AppError(
      503,
      "WEATHER_API_UNAVAILABLE",
      "Weather API is unavailable",
      [],
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
