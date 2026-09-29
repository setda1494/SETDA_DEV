import { Role } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { CreateTypedFields, TypedFields } from "@/components/admin-content-fields";
import { createContentAction, updateContentAction, archiveContentAction, restoreContentAction } from "@/app/actions/admin-content";
import { changeUserRoleAction } from "@/app/actions/user-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const metadata = { title: "Admin" };

function auditSubject(a: { action: string; contentKind: string | null; contentKey: string | null; before: unknown; after: unknown }) {
  if (a.action === "USER_ROLE_CHANGE") {
    const after = a.after as { email?: string; role?: string } | null;
    return after?.email ? `USER / ${after.email} → ${after.role ?? "?"}` : "USER / role change";
  }
  return `${a.contentKind ?? "-"} / ${a.contentKey ?? "-"}`;
}

export default async function Admin() {
  const user = await requireAdmin();
  const [entries, audits, users] = await Promise.all([
    db.contentEntry.findMany({ orderBy: { updatedAt: "desc" } }),
    db.auditLog.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { actor: { select: { displayName: true, role: true } } } }),
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, displayName: true, role: true, createdAt: true, _count: { select: { sessions: true, saves: true } } },
    }),
  ]);

  return <>
    <PageHeader eyebrow="CONTROL PLANE" title="Admin Console" description="Typed content operations, user access control, and audit history."/>
    <div className="info-box"><b>Admin operations</b><p>Signed in as {user.displayName} · {user.role}. OWNER can manage roles; SYSTEM has read-only user visibility.</p></div>

    <section className="admin-section">
      <div className="section-title"><div><p className="eyebrow">ACCESS</p><h2>User administration</h2></div><span className="media-count">{users.length} users</span></div>
      <div className="admin-table user-admin-table">
        <div className="admin-row admin-head user-admin-row"><span>USER</span><span>ROLE</span><span>ACTIVITY</span><span>ACCESS</span></div>
        {users.map((target) => {
          const isSelf = target.id === user.id;
          const canManage = user.role === Role.OWNER && !isSelf && target.role !== Role.SYSTEM;
          return <div className="admin-row user-admin-row" key={target.id}>
            <span><b>{target.displayName}</b><small>{target.email}<br/>Joined {target.createdAt.toISOString().slice(0, 10)}</small></span>
            <span className="status">{target.role}{isSelf ? " · YOU" : ""}</span>
            <span>{target._count.sessions} sessions · {target._count.saves} saves</span>
            <span>{canManage ? <form className="role-form" action={changeUserRoleAction}>
              <input type="hidden" name="userId" value={target.id}/>
              <select name="role" defaultValue={target.role} aria-label={`Role for ${target.email}`}>
                <option value={Role.USER}>USER</option><option value={Role.OWNER}>OWNER</option>
              </select>
              <button className="btn" type="submit">Apply</button>
            </form> : <small>{isSelf ? "Self role locked" : target.role === Role.SYSTEM ? "Service-managed" : "Read only"}</small>}</span>
          </div>;
        })}
      </div>
    </section>

    <section className="admin-section"><div className="section-title"><div><p className="eyebrow">CREATE</p><h2>New content entry</h2></div></div><form className="admin-form card" action={createContentAction}><CreateTypedFields/><label>Key<input name="key" required placeholder="project-slug"/></label><label>Title<input name="title" required maxLength={120}/></label><label className="check"><input type="checkbox" name="published"/> Published</label><button className="btn primary" type="submit">Create entry</button></form></section>

    <section className="admin-section"><div className="section-title"><div><p className="eyebrow">DATABASE</p><h2>Managed content</h2></div><span className="media-count">{entries.length} entries</span></div>{entries.length===0?<div className="media-empty"><div><b>No managed content yet</b></div></div>:<div className="admin-editor-list">{entries.map(e=><form className="admin-editor card" action={updateContentAction} key={e.id}><input type="hidden" name="id" value={e.id}/><div className="admin-editor-head"><div><b>{e.kind} / {e.key}</b><small>Updated {e.updatedAt.toISOString()}</small></div><span className="status">{e.archivedAt?"ARCHIVED":e.published?"PUBLISHED":"DRAFT"}</span></div><label>Title<input name="title" defaultValue={e.title} required maxLength={120} disabled={Boolean(e.archivedAt)}/></label><TypedFields kind={e.kind} data={e.data} disabled={Boolean(e.archivedAt)}/><details className="advanced-json"><summary>Advanced JSON reference</summary><pre>{JSON.stringify(e.data,null,2)}</pre></details><div className="admin-editor-actions">{!e.archivedAt&&<><label className="check"><input type="checkbox" name="published" defaultChecked={e.published}/> Published</label><button className="btn" type="submit">Save changes</button><button className="btn" formAction={archiveContentAction}>Archive</button></>}{e.archivedAt&&<button className="btn" formAction={restoreContentAction}>Restore</button>}</div></form>)}</div>}</section>

    <section className="admin-section"><div className="section-title"><div><p className="eyebrow">AUDIT</p><h2>Recent changes</h2></div></div><div className="admin-table"><div className="admin-row admin-head"><span>ACTION</span><span>SUBJECT</span><span>ACTOR</span><span>TIME</span></div>{audits.map(a=><div className="admin-row" key={a.id}><span>{a.action}</span><code>{auditSubject(a)}</code><span>{a.actor.displayName} · {a.actor.role}</span><span>{a.createdAt.toISOString()}</span></div>)}</div></section>
  </>;
}
