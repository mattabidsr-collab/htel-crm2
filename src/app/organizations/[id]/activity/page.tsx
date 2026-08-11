import { CallNoteReviewForm } from "@/components/call-notes/CallNoteReviewForm";
import { CreateCallNoteForm } from "@/components/call-notes/CreateCallNoteForm";
import * as callNotesService from "@/modules/call-notes/service";
import { listAssociatedThreads } from "@/modules/email/threads";

export default async function OrganizationActivityPage(
  props: PageProps<"/organizations/[id]/activity">,
) {
  const { id } = await props.params;
  const [callNotes, threads] = await Promise.all([
    callNotesService.listCallNotes(id),
    listAssociatedThreads(id),
  ]);

  return (
    <div>
      <section className="home__card">
        <h2>Call notes ({callNotes.length})</h2>
        <CreateCallNoteForm organizationId={id} />
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Direction</th>
              <th>Summary</th>
              <th>Disposition</th>
              <th>Author</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {callNotes.map((note) => (
              <tr key={note.id}>
                <td>{note.occurredAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td>{note.direction}</td>
                <td>
                  {note.summary}
                  {note.needsReview && <span className="badge badge-warn"> Needs review</span>}
                </td>
                <td>{note.disposition ?? "—"}</td>
                <td>{note.author?.name ?? "System"}</td>
                <td>{note.source === "SKYSWITCH_CDR" ? "SkySwitch CDR" : "Manual"}</td>
                <td>{note.needsReview && <CallNoteReviewForm callNoteId={note.id} />}</td>
              </tr>
            ))}
            {callNotes.length === 0 && (
              <tr>
                <td colSpan={7} className="home__empty-state">
                  No call notes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="home__card">
        <h2>Email ({threads.length} thread{threads.length === 1 ? "" : "s"})</h2>
        {threads.length === 0 ? (
          <p className="home__empty-state">No associated email yet.</p>
        ) : (
          threads.map((thread) => (
            <details key={thread.id} className="email-thread">
              <summary>
                {thread.subject ?? "(no subject)"} — via {thread.mailbox.emailAddress} (
                {thread.messages.length} message{thread.messages.length === 1 ? "" : "s"})
              </summary>
              {thread.messages.map((message) => (
                <div key={message.id} className="email-message">
                  <p className="email-message__meta">
                    <strong>{message.direction === "INBOUND" ? "From" : "To"}:</strong>{" "}
                    {message.direction === "INBOUND" ? message.fromAddress : message.toAddresses.join(", ")}
                    {" · "}
                    {message.sentAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                  {message.bodyHtmlSanitized ? (
                    // Sanitized server-side via sanitize-html before storage (ACT-14).
                    <div
                      className="email-message__body"
                      dangerouslySetInnerHTML={{ __html: message.bodyHtmlSanitized }}
                    />
                  ) : (
                    <p className="email-message__body">{message.bodyText}</p>
                  )}
                </div>
              ))}
            </details>
          ))
        )}
      </section>
    </div>
  );
}
