import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="space-y-4 p-6 text-center">
        <h1 className="font-bold text-6xl text-[var(--accent-gold)]">404</h1>
        <h2 className="font-semibold text-[var(--text-primary)] text-xl">
          Halaman tidak ditemukan
        </h2>
        <p className="max-w-md text-[var(--text-muted)]">
          Halaman yang kamu cari tidak tersedia. Mungkin sudah dipindahkan atau kamu mengakses URL
          yang salah.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[var(--accent-gold)] px-6 py-2.5 font-semibold text-sm text-white hover:opacity-90"
        >
          Kembali ke Beranda
        </Link>
        <p className="mt-4 text-[var(--text-muted)] text-xs">
          Aplikasi ini dapat diakses secara offline. Beberapa fitur mungkin terbatas.
        </p>
      </div>
    </div>
  );
}
