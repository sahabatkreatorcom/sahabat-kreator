import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-messages";

export class ApiResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
  }
}

export function throwApiResponseError(response: Response, fallback = "Request failed"): never {
  throw new ApiResponseError(fallback, response.status);
}

export async function handleApiError(
  response: Response,
  fallback = "Terjadi kesalahan",
): Promise<string> {
  let rawMessage = fallback;
  try {
    const body = await response.json();
    rawMessage = body.error || body.message || fallback;
  } catch {
    // Response body wasn't JSON — use fallback
  }

  const friendly = getUserFriendlyError(rawMessage);

  if (response.status === 429 || friendly.category === "rate_limit") {
    toast.warning(friendly.message, { description: friendly.suggestion });
  } else if (response.status === 401 || response.status === 403 || friendly.category === "auth") {
    toast.warning(friendly.message, { description: friendly.suggestion });
  } else {
    toast.error(friendly.message, { description: friendly.suggestion });
  }

  return friendly.message;
}

export function showErrorToast(error: unknown, fallbackTitle?: string) {
  const friendly = getUserFriendlyError(error);
  toast.error(fallbackTitle || friendly.message, {
    description: friendly.suggestion,
  });
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
  errorFallback?: string,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const msg = await handleApiError(response, errorFallback);
    throw new ApiResponseError(msg, response.status);
  }

  return response.json();
}
