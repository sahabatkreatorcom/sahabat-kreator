/**
 * Email Digest Worker
 * Runs on demand when triggered by the scheduled-digest worker.
 *
 * Responsibilities:
 * - Generates daily / weekly / monthly analytics reports per organization
 * - Renders an HTML email via Resend
 * - Creates a shareable report URL (stub for PDF generation)
 * - Persists the report record in email_report table
 */

import { db } from "@sahabatkreator/db";
import { emailReport, organization, postAnalytics } from "@sahabatkreator/db/schema";
import { connection, type EmailDigestJobData } from "@sahabatkreator/jobs";
import { sendEmail } from "@sahabatkreator/jobs/resend";
import { type Job, Worker } from "bullmq";
import { and, eq, gte, lt } from "drizzle-orm";

// ── Report renderer ──────────────────────────────────────────────────

function renderDigestHtml(
  orgName: string,
  periodType: string,
  periodStart: string,
  periodEnd: string,
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    growthViews?: number;
    growthLikes?: number;
    growthComments?: number;
  },
): string {
  const growthBadge = (value?: number, label = "") => {
    if (value === undefined) return "";
    const color = value >= 0 ? "#16a34a" : "#dc2626";
    const arrow = value >= 0 ? "↑" : "↓";
    return `<span style="color:${color};font-weight:600">${arrow} ${Math.abs(value)}% ${label}</span>`;
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sahabat Kreator ${periodType} Report</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fafafa;">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h1 style="color:#D4A574;margin-bottom:4px">Laporan ${periodType}</h1>
    <p style="color:#666;font-size:14px">${orgName} · ${periodStart} s/d ${periodEnd}</p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">👁 Total Views</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${stats.views.toLocaleString()}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${growthBadge(stats.growthViews, "vs lalu")}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">❤️ Likes</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${stats.likes.toLocaleString()}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${growthBadge(stats.growthLikes)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">💬 Comments</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${stats.comments.toLocaleString()}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${growthBadge(stats.growthComments)}</td></tr>
      <tr><td style="padding:8px 0;color:#555">🔗 Shares</td>
          <td style="padding:8px 0;text-align:right;font-weight:700">${stats.shares.toLocaleString()}</td>
          <td style="padding:8px 0"></td></tr>
    </table>

    <p style="margin-top:24px;color:#555;font-size:14px">
      Lanjutkan berkarya! Lihat analisis lengkap di dashboard Sahabat Kreator.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sahabatkreator.id"}/dashboard"
       style="display:inline-block;margin-top:12px;background:#D4A574;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
      Buka Dashboard
    </a>
  </div>
  <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px">
    Dikirim otomatis oleh Sahabat Kreator · Balas email ini jika ada pertanyaan
  </p>
</body>
</html>`.trim();
}

// ── Period aggregation helper ────────────────────────────────────────

async function getPeriodStats(
  orgId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  previous?: { views: number; likes: number; comments: number };
}> {
  const rows = await db
    .select({
      views: postAnalytics.views,
      likes: postAnalytics.likes,
      comments: postAnalytics.comments,
      shares: postAnalytics.shares,
    })
    .from(postAnalytics)
    .where(
      and(
        eq(postAnalytics.organizationId, orgId),
        gte(postAnalytics.date, periodStart),
        lt(postAnalytics.date, periodEnd),
      ),
    );

  const agg = rows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      likes: acc.likes + r.likes,
      comments: acc.comments + r.comments,
      shares: acc.shares + r.shares,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 },
  );

  // Previous period (same length immediately before)
  const ms = periodEnd.getTime() - periodStart.getTime();
  const prevEnd = new Date(periodStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  const prevRows = await db
    .select({
      views: postAnalytics.views,
      likes: postAnalytics.likes,
      comments: postAnalytics.comments,
    })
    .from(postAnalytics)
    .where(
      and(
        eq(postAnalytics.organizationId, orgId),
        gte(postAnalytics.date, prevStart),
        lt(postAnalytics.date, prevEnd),
      ),
    );

  const prev = prevRows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      likes: acc.likes + r.likes,
      comments: acc.comments + r.comments,
    }),
    { views: 0, likes: 0, comments: 0 },
  );

  return { ...agg, previous: prev };
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Worker ───────────────────────────────────────────────────────────

export const emailDigestWorker = new Worker<EmailDigestJobData>(
  "email-digest",
  async (job: Job<EmailDigestJobData>) => {
    const { organizationId, recipientEmail, periodType, periodStart, periodEnd, reportId } =
      job.data;
    console.log(`[EmailDigest] job=${job.id} org=${organizationId} period=${periodType}`);

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Gather org metadata
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId));

    const stats = await getPeriodStats(organizationId, start, end);

    // Compute growth percentages
    const growthViews = stats.previous
      ? Math.round(((stats.views - stats.previous.views) / Math.max(stats.previous.views, 1)) * 100)
      : undefined;
    const growthLikes = stats.previous
      ? Math.round(((stats.likes - stats.previous.likes) / Math.max(stats.previous.likes, 1)) * 100)
      : undefined;
    const growthComments = stats.previous
      ? Math.round(
          ((stats.comments - stats.previous.comments) / Math.max(stats.previous.comments, 1)) * 100,
        )
      : undefined;

    const html = renderDigestHtml(
      org?.name ?? organizationId,
      periodType,
      fmtDate(start),
      fmtDate(end),
      { ...stats, growthViews, growthLikes, growthComments },
    );

    const subject = `Laporan ${periodType} — Sahabat Kreator`;

    // Send via Resend
    const emailResult = await sendEmail({ to: recipientEmail, subject, html });
    if (!emailResult.success) {
      throw new Error(`Email send failed: ${emailResult.error}`);
    }

    // Persist report record
    const report = await db
      .insert(emailReport)
      .values({
        id: reportId ?? crypto.randomUUID(),
        organizationId,
        periodStart: start,
        periodEnd: end,
        recipientEmail,
        status: "COMPLETED",
        reportUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sahabatkreator.id"}/reports/${reportId}`,
        generatedAt: new Date(),
      })
      .returning();

    console.log(`[EmailDigest] Report ${report[0]?.id} sent to ${recipientEmail}`);
    return {
      sent: true,
      reportId: report[0]?.id,
      to: recipientEmail,
      timestamp: new Date().toISOString(),
    };
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  },
);

emailDigestWorker.on("completed", (job) => {
  console.log(`[EmailDigest] Job ${job.id} completed`);
});

emailDigestWorker.on("failed", (job, err) => {
  console.error(`[EmailDigest] Job ${job?.id} failed: ${err.message}`);
});
