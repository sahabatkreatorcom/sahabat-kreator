import { env } from "@sahabatkreator/env/server";
import { Resend } from "resend";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// ── Generic email sender ─────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY not configured. Email not sent.");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL || "Sahabat Kreator <noreply@resend.dev>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Resend] Email sent to ${options.to}: ${data.data?.id}`);
    return { success: true, messageId: data.data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Resend] Failed to send email: ${message}`);
    return { success: false, error: message };
  }
}

// ── Template functions ────────────────────────────────────────────

export function renderWelcomeEmail(name: string, loginUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D4A574;">Selamat datang di Sahabat Kreator! 👋</h1>
        <p>Halo ${name},</p>
        <p>Terima kasih telah bergabung dengan Sahabat Kreator. Platform ini akan membantu Anda mengelola dan menjadwalkan konten media sosial dengan lebih efisien.</p>
        <p>📅 <strong>Fitur yang tersedia:</strong></p>
        <ul>
          <li>📝 Buat & jadwalkan post untuk Instagram, TikTok, YouTube</li>
          <li>📊 Pantau performa konten</li>
          <li>👥 Kelola tim dengan mudah</li>
          <li>🤖 Dapatkan saran AI untuk konten</li>
        </ul>
        <p><a href="${loginUrl}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">Mulai Sekarang</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">Butuh bantuan? Balas email ini atau hubungi tim kami.</p>
      </body>
    </html>
  `.trim();
}

export function renderPasswordResetEmail(name: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D4A574;">Reset Password 🔐</h1>
        <p>Halo ${name},</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <a href="${resetLink}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">Reset Password</a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Link ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </body>
    </html>
  `.trim();
}

export function renderInvitationEmail(
  inviterName: string,
  orgName: string,
  inviteLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D4A574;">Undangan Bergabung 🎉</h1>
        <p>Halo,</p>
        <p><strong>${inviterName}</strong> mengundang Anda untuk bergabung di organisasi <strong>${orgName}</strong> di Sahabat Kreator.</p>
        <p>Klik tombol di bawah untuk menerima undangan:</p>
        <a href="${inviteLink}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">Terima Undangan</a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Undangan ini akan kedaluwarsa dalam 7 hari.</p>
      </body>
    </html>
  `.trim();
}

// ── Public helpers used by routes ─────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const loginUrl = env.NEXT_PUBLIC_APP_URL ?? "https://sahabatkreator.id";
  const html = renderWelcomeEmail(name, loginUrl);
  await sendEmail({ to, subject: "Selamat Datang di Sahabat Kreator!", html });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const userName = to.split("@")[0] || "User";
  const html = renderPasswordResetEmail(userName, resetLink);
  await sendEmail({ to, subject: "Reset Password Sahabat Kreator", html });
}

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  orgName: string,
  inviteLink: string,
): Promise<void> {
  const html = renderInvitationEmail(inviterName, orgName, inviteLink);
  await sendEmail({ to, subject: `Undangan Bergabung di ${orgName}`, html });
}
