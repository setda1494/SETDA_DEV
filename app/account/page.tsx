import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { revokeAllSessionsAction, revokeOtherSessionsAction } from "@/app/actions/account";

export const metadata = { title: "Account" };

export default async function Account({ searchParams }: { searchParams: Promise<{ revoked?: string }> }) {
  const current = await currentSession();
  if (!current) redirect("/login?next=/account");
  const q = await searchParams;
  const sessions = await db.session.findMany({
    where: { userId: current.user.id, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

  return <>
    <PageHeader eyebrow="ACCOUNT" title={current.user.displayName} description="Account identity and active sign-in sessions."/>
    {q.revoked === "others" && <div className="info-box"><b>Other sessions revoked.</b><p>This browser remains signed in.</p></div>}
    <section className="admin-section">
      <div className="section-title"><div><p className="eyebrow">IDENTITY</p><h2>Profile</h2></div></div>
      <div className="card account-profile"><div><small>EMAIL</small><b>{current.user.email}</b></div><div><small>ROLE</small><b>{current.user.role}</b></div></div>
    </section>
    <section className="admin-section">
      <div className="section-title"><div><p className="eyebrow">SECURITY</p><h2>Active sessions</h2></div><span className="media-count">{sessions.length} active</span></div>
      <div className="admin-table">
        <div className="admin-row admin-head"><span>SESSION</span><span>CREATED</span><span>EXPIRES</span><span>STATUS</span></div>
        {sessions.map((session) => <div className="admin-row" key={session.id}><code>{session.id.slice(0, 10)}…</code><span>{session.createdAt.toISOString()}</span><span>{session.expiresAt.toISOString()}</span><span className="status">{session.id === current.id ? "CURRENT" : "ACTIVE"}</span></div>)}
      </div>
      <div className="session-actions">
        <form action={revokeOtherSessionsAction}><button className="btn" type="submit">Revoke other sessions</button></form>
        <form action={revokeAllSessionsAction}><button className="btn" type="submit">Sign out everywhere</button></form>
      </div>
    </section>
  </>;
}
