import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { recordAuditEvent } from "@/lib/audit";
import * as usersRepo from "@/modules/users/repository";
import type { InviteUserInput, UpdateUserInput } from "@/modules/users/schema";

export class DuplicateUserError extends Error {
  constructor() {
    super("A user with this email already exists");
  }
}

function generateTemporaryPassword() {
  return randomBytes(12).toString("base64url");
}

export async function inviteUser(input: InviteUserInput, actorId: string) {
  const existing = await usersRepo.findUserByEmail(input.email);
  if (existing) throw new DuplicateUserError();

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const user = await usersRepo.createUser({
    email: input.email,
    name: input.name,
    role: input.role,
    passwordHash,
  });

  await recordAuditEvent({
    actorId,
    action: "user.invited",
    entityType: "User",
    entityId: user.id,
    after: { email: user.email, name: user.name, role: user.role },
  });

  // ADM-02: no email infrastructure yet — the temporary password is returned
  // once so the administrator can relay it out-of-band.
  return { user, temporaryPassword };
}

export function listUsers() {
  return usersRepo.listUsers();
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  const before = await usersRepo.findUserById(id);
  if (!before) throw new Error("User not found");

  const data: { role?: typeof before.role; isActive?: boolean; deactivatedAt?: Date | null } = {};
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
    data.deactivatedAt = input.isActive ? null : new Date();
  }

  const user = await usersRepo.updateUser(id, data);

  await recordAuditEvent({
    actorId,
    action: input.isActive === false ? "user.deactivated" : "user.updated",
    entityType: "User",
    entityId: id,
    before: { role: before.role, isActive: before.isActive },
    after: { role: user.role, isActive: user.isActive },
  });

  const openTaskCount =
    input.isActive === false ? await usersRepo.countOpenTasksForOwner(id) : undefined;

  return { user, openTaskCount };
}
