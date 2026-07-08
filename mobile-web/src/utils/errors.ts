import { isAxiosError } from 'axios';

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const errors = err.response?.data?.errors as Record<string, string[]> | undefined;
    const firstMessage = errors ? Object.values(errors)[0]?.[0] : undefined;
    return firstMessage ?? err.response?.data?.message ?? fallback;
  }
  return fallback;
}
