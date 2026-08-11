import { CreateContactForm } from "@/components/organizations/CreateContactForm";
import * as contactsService from "@/modules/contacts/service";

export default async function OrganizationContactsPage(
  props: PageProps<"/organizations/[id]/contacts">,
) {
  const { id } = await props.params;
  const contacts = await contactsService.listContactsForOrganization(id);

  return (
    <div>
      <CreateContactForm organizationId={id} />

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                {contact.firstName} {contact.lastName}
              </td>
              <td>{contact.affiliations[0]?.role ?? "—"}</td>
              <td>{contact.emails[0] ?? "—"}</td>
              <td>{contact.phones[0] ?? "—"}</td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={4} className="home__empty-state">
                No contacts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
