import { z } from "zod";
import { UserRole } from "@prisma/client";

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
