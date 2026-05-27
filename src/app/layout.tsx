import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAILLAT.",
  description: "Portfolio de Lucas Caillat - Freelance Informatique",
  icons: {
    icon: "/bentosite/favicon.png",
    shortcut: "/bentosite/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/png" href="/bentosite/favicon.png?v=2" />
        <link rel="shortcut icon" href="/bentosite/favicon.ico?v=2" />
        <link rel="manifest" href="/bentosite/manifest.json" />
        <meta name="theme-color" content="#0d0d0d" />
        <link rel="apple-touch-icon" href="/bentosite/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/bentosite/sw.js').then(
                    function(registration) {
                      console.log('PWA Service Worker registered with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('PWA Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-text-black bg-background">{children}</body>
    </html>
  );
}
