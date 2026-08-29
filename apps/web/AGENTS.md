<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

repo referensi E:\socaliseit\app dan implementasikan di proyek baru "Sahabat Kreator" dengan beberapa penyesuaian
1. Copy paste UI/UX dari repo referensi
2. Sahabat Kreator menggunakan better-auth dengan organization, admin, dan 2FA
3. ORM menggunakan drizzle
4. hapus stripe dan pembayaran menggunakan somopod-pay (dokumentasi ada di folder docs dan packages/payment)
5. tambahkan org switcher
6. seb_ di ganti menjadi sk_ 
7. target Indonesia
8. email menggunakan resend
9. storage menggunakan R2 cloudflare