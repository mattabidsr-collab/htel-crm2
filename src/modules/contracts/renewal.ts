import { db } from "@/lib/db";

// Spec 5.3.3: create alerts and tasks at configurable intervals, initially
// 180, 120, 90, and 60, and 30 days out from the action deadline.
export const RENEWAL_ALERT_INTERVAL_DAYS = [180, 120, 90, 60, 30] as const;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Business rule 3: contract action deadline equals the applicable end or
// renewal date minus required notice days.
export function computeActionDeadline(contract: { endDate: Date | null; noticeDays: number }) {
  if (!contract.endDate) return null;
  return addDays(contract.endDate, -contract.noticeDays);
}

// Removes any not-yet-completed renewal alert tasks this contract already
// has, then recreates them from the current end date / notice days — keeps
// regeneration idempotent when a contract's dates change.
export async function regenerateRenewalAlertTasks(
  contractId: string,
  organizationId: string,
  ownerId: string,
  actorId: string,
  contract: { endDate: Date | null; noticeDays: number },
) {
  await db.task.deleteMany({
    where: {
      relatedType: "Contract",
      relatedId: contractId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const actionDeadline = computeActionDeadline(contract);
  if (!actionDeadline) return [];

  const tasks = await Promise.all(
    RENEWAL_ALERT_INTERVAL_DAYS.map((days) =>
      db.task.create({
        data: {
          title: `Contract renewal action needed in ${days} days`,
          organizationId,
          relatedType: "Contract",
          relatedId: contractId,
          ownerId,
          createdById: actorId,
          dueDate: addDays(actionDeadline, -days),
          priority: days <= 30 ? "HIGH" : "NORMAL",
        },
      }),
    ),
  );

  return tasks;
}
