import { recordAuditEvent } from "@/lib/audit";
import * as tasksRepo from "@/modules/tasks/repository";
import type { CreateTaskInput, UpdateTaskInput } from "@/modules/tasks/schema";

export async function createTask(input: CreateTaskInput, actorId: string) {
  const task = await tasksRepo.createTask(input, actorId);
  await recordAuditEvent({
    actorId,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    after: task,
  });
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput, actorId: string) {
  const before = await tasksRepo.findTaskById(id);
  if (!before) throw new Error("Task not found");

  const task = await tasksRepo.updateTask(id, input);

  await recordAuditEvent({
    actorId,
    action: "task.update",
    entityType: "Task",
    entityId: id,
    before: { status: before.status, ownerId: before.ownerId },
    after: { status: task.status, ownerId: task.ownerId },
  });

  return task;
}

export async function getMyWorkQueue(ownerId: string) {
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [overdue, upcoming] = await Promise.all([
    tasksRepo.listOverdueTasksForOwner(ownerId, now),
    tasksRepo.listUpcomingTasksForOwner(ownerId, now, sevenDaysOut),
  ]);

  return { overdue, upcoming };
}
