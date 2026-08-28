import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Sahabat Kreator",
    template: "%s | Sahabat Kreator",
  },
  description: "Platform manajemen media sosial untuk kreator Indonesia",
  keywords: ["media sosial", "jadwal posting", "analitik", "manajemen konten", "kreator Indonesia"],
  manifest: "/pwa-manifest.json",
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", type: "image/png" },
    ],
  },
  applicationName: "Sahabat Kreator",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sahabat Kreator",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4A574" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F12" },
  ],
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('sahabatkreator-appearance');
    if (saved) {
      var prefs = JSON.parse(saved);
      if (prefs.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      if (prefs.accentGold) {
        document.documentElement.style.setProperty('--accent-gold', prefs.accentGold);
      }
      if (prefs.accentPink) {
        document.documentElement.style.setProperty('--accent-pink', prefs.accentPink);
      }
    }
  } catch (e) { console.warn('[Theme] Gagal memuat preferensi:', e); }
})();
`;

const swRegisterScript = `
(function() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(reg) { console.log('[SW] Registered:', reg.scope); })
        .catch(function(err) { console.warn('[SW] Register failed:', err); });
    });
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#D4A574" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sahabat Kreator" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body className={inter.className}>
        <Providers>
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
