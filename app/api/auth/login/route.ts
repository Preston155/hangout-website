import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createSessionCookie, getRequestMeta } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { fail, handleApiError, ok } from '@/lib/server/responses';

const loginSchema = z.object({
  pin: z.string().regex(/^\d{4,12}$/, 'Enter a valid employee PIN.'),
});

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const { pin } = loginSchema.parse(await request.json());
    const meta = await getRequestMeta();
    const employees = await prisma.employee.findMany({ where: { active: true } });
    const now = new Date();

    for (const employee of employees) {
      if (employee.lockedUntil && employee.lockedUntil > now) continue;
      const matches = await bcrypt.compare(pin, employee.pinHash);
      if (!matches) continue;

      await prisma.$transaction([
        prisma.employee.update({
          where: { id: employee.id },
          data: { failedAttempts: 0, lockedUntil: null },
        }),
        prisma.loginActivity.create({
          data: { employeeId: employee.id, success: true, ipHash: meta.ipHash, userAgent: meta.userAgent },
        }),
        prisma.auditLog.create({
          data: { actingEmployeeId: employee.id, action: 'EMPLOYEE_LOGIN', entityType: 'Employee', entityId: employee.id },
        }),
      ]);
      await createSessionCookie(employee.id);
      return ok({ employee: { id: employee.id, name: employee.name, role: employee.role } });
    }

    const candidate = employees.find((employee) => !employee.lockedUntil || employee.lockedUntil <= now);
    if (candidate) {
      const failedAttempts = candidate.failedAttempts + 1;
      await prisma.employee.update({
        where: { id: candidate.id },
        data: {
          failedAttempts,
          lockedUntil: failedAttempts >= LOCK_AFTER_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
    }
    await prisma.loginActivity.create({ data: { success: false, ipHash: meta.ipHash, userAgent: meta.userAgent } });
    return fail('Wrong PIN or account temporarily locked.', 401);
  } catch (error) {
    return handleApiError(error);
  }
}
