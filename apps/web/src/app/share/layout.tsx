/**
 * Sahabat Kreator - Public Layout
 * Minimal layout for share/public pages without sidebar
 */
export { metadata } from "../layout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
