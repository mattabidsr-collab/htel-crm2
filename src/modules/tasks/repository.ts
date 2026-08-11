import { db } from "@/lib/db";
import type { CreateTaskInput, UpdateTaskInput } from "@/modules/tasks/schema";

export function createTask(input: CreateTaskInput, createdById: string) {
  return db.task.create({ data: { ...input, createdById } });
}

export function findTaskById(id: string) {
  return db.task.findUnique({ where: { id } });
}

export function updateTask(id: string, data: UpdateTaskInput) {
  return db.task.update({
    where: { id },
    data: { ...data, completedAt: data.status === "COMPLETED" ? new Date() : undefined },
  });
}

export function listOverdueTasksForOwner(ownerId: string, now: Date) {
  return db.task.findMany({
    where: { ownerId, status: { in: ["OPEN", "IN_PROGRESS"] }, dueDate: { lt: now } },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export function listUpcomingTasksForOwner(ownerId: string, now: Date, sevenDaysOut: Date) {
  return db.task.findMany({
    where: {
      ownerId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      dueDate: { gte: now, lte: sevenDaysOut },
    },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });
}
