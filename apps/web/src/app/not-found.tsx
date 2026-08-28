import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center space-y-4 p-6">
        <h1 className="text-6xl font-bold text-[var(--accent-gold)]">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Halaman tidak ditemukan</h2>
        <p className="text-[var(--text-muted)] max-w-md">
          Halaman yang kamu cari tidak tersedia. Mungkin sudah dipindahkan atau kamu mengakses URL
          yang salah.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[var(--accent-gold)] px-6 py-2.5 font-semibold text-sm text-white hover:opacity-90"
        >
          Kembali ke Beranda
        </Link>
        <p className="text-[var(--text-muted)] text-xs mt-4">
          Aplikasi ini dapat diakses secara offline. Beberapa fitur mungkin terbatas.
        </p>
      </div>
    </div>
  );
}
