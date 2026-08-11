import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { UserActions } from "@/components/admin/UserActions";
import * as usersService from "@/modules/users/service";

export default async function AdminUsersPage() {
  await requirePageRole(UserRole.ADMINISTRATOR);
  const users = await usersService.listUsers();

  return (
    <div>
      <h1>Users</h1>
      <p className="page-subtitle">
        Invite team members, assign roles, and deactivate accounts without losing their
        historical ownership (ADM-02).
      </p>

      <InviteUserForm />

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>MFA</th>
            <th>Status</th>
            <th>Owned tasks / accounts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.mfaEnabled ? "Enabled" : "Not enrolled"}</td>
              <td>{user.isActive ? "Active" : "Deactivated"}</td>
              <td>
                {user._count.ownedTasks} / {user._count.ownedOrganizations}
              </td>
              <td>
                <UserActions userId={user.id} role={user.role} isActive={user.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
