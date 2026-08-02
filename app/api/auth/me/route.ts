import { getEmployeeFromSession } from '@/lib/server/auth';
import { handleApiError, ok } from '@/lib/server/responses';

export async function GET() {
  try {
    const employee = await getEmployeeFromSession();
    return ok({ employee });
  } catch (error) {
    return handleApiError(error);
  }
}
