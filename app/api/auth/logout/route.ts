import { clearSessionCookie } from '@/lib/server/auth';
import { handleApiError, ok } from '@/lib/server/responses';

export async function POST() {
  try {
    await clearSessionCookie();
    return ok({ signedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
