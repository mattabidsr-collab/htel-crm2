import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  ownerId: z.string().uuid(),
  dueDate: z.coerce.date().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  ownerId: z.string().uuid().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
