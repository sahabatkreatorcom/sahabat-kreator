import { db } from "@sahabatkreator/db";
import { invitation, member, organization, user } from "@sahabatkreator/db/schema";
import { queueEmail } from "@sahabatkreator/jobs";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const teamApp = new Hono();

teamApp.use("/*", requireAuth);

// GET /api/team/members
teamApp.get("/members", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);

  // Get members with user details
  const members = await db
    .select({
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .leftJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
    .orderBy(desc(member.createdAt));

  // Get pending invitations
  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt,
      inviterName: user.name,
    })
    .from(invitation)
    .leftJoin(user, eq(invitation.inviterId, user.id))
    .where(and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")));

  return c.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      name: m.userName || "Unknown",
      email: m.userEmail || m.userId,
      avatar: m.userImage,
      createdAt: m.createdAt.toISOString(),
      isCurrentUser: m.userId === userId,
    })),
    invitations: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      inviterName: inv.inviterName || "Unknown",
    })),
  });
});

// POST /api/team/invite
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

teamApp.post("/invite", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  // Check if sender is admin or owner
  const senderMember = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.userId, userId)),
    columns: { role: true },
  });

  if (!senderMember || !["OWNER", "ADMIN"].includes(senderMember.role as string)) {
    return c.json({ error: "Only admins can invite members" }, 403);
  }

  const { email } = parsed.data;

  // Check if already invited
  const existingInvitation = await db.query.invitation.findFirst({
    where: and(eq(invitation.organizationId, organizationId), eq(invitation.email, email)),
  });

  if (existingInvitation) {
    return c.json({ error: "Invitation already sent to this email" }, 409);
  }

  // Create invitation
  const [createdInvitation] = await db
    .insert(invitation)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      email,
      role: parsed.data.role,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      inviterId: userId,
    })
    .returning();

  // Send email invitation (async - don't block response)
  if (createdInvitation) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { name: true },
    });

    const inviter = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { name: true },
    });

    // Queue email for async processing
    const orgName = org?.name || "Organisasi";
    const inviterName = inviter?.name || "Admin";
    queueEmail({
      to: email,
      subject: `Undangan Bergabung di ${orgName}`,
      body: `${inviterName} mengundang Anda untuk bergabung di ${orgName}`,
    }).catch(console.error);
  }

  return c.json({ invitation: createdInvitation }, 201);
});

// PUT /api/team/members/:id/role
const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

teamApp.put("/members/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const currentUserId = getUserId(c);
  const memberId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateRoleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid role" }, 400);
  }

  // Check if current user is admin
  const currentUser = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.userId, currentUserId)),
    columns: { role: true },
  });

  if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role as string)) {
    return c.json({ error: "Only admins can change roles" }, 403);
  }

  // Update role
  const [updated] = await db
    .update(member)
    .set({ role: parsed.data.role })
    .where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.json({ member: updated });
});

// DELETE /api/team/members/:id
teamApp.delete("/members/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const currentUserId = getUserId(c);
  const memberId = c.req.param("id");

  // Prevent self-removal
  const currentMember = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.userId, currentUserId)),
    columns: { role: true },
  });

  if (!currentMember || !["admin", "owner"].includes(currentMember.role)) {
    return c.json({ error: "Only admins can remove members" }, 403);
  }

  const [removed] = await db
    .delete(member)
    .where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)))
    .returning();

  if (!removed) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.json({ success: true });
});

// POST /api/team/invitations/:id/resend
teamApp.post("/invitations/:id/resend", async (c) => {
  const organizationId = getOrganizationId(c);
  const invitationId = c.req.param("id");

  const existingInvitation = await db.query.invitation.findFirst({
    where: and(
      eq(invitation.id, invitationId),
      eq(invitation.organizationId, organizationId),
      eq(invitation.status, "pending"),
    ),
    with: {
      user: { columns: { name: true } },
      organization: { columns: { name: true } },
    },
  });

  if (!existingInvitation) {
    return c.json({ error: "Invitation not found" }, 404);
  }

  // Queue resend email
  const orgName = existingInvitation.organization?.name || "Organisasi";
  const inviterName = existingInvitation.user?.name || "Admin";
  queueEmail({
    to: existingInvitation.email,
    subject: `Undangan Bergabung di ${orgName}`,
    body: `${inviterName} mengundang Anda untuk bergabung di ${orgName}`,
  }).catch(console.error);

  return c.json({ success: true });
});

// DELETE /api/team/invitations/:id (cancel invitation)
teamApp.delete("/invitations/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const invitationId = c.req.param("id");

  const [deleted] = await db
    .delete(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.organizationId, organizationId)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Invitation not found" }, 404);
  }

  return c.json({ success: true });
});

export default teamApp;
