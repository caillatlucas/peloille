import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PELOILLE.",
  description: "Portfolio de Lola Peloille - Artiste peintre",
  icons: {
    icon: "/peloille/favicon.svg",
    shortcut: "/peloille/favicon.svg",
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
      className={`${syne.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/peloille/favicon.svg?v=3" />
        <link rel="shortcut icon" href="/peloille/favicon.svg?v=3" />
        <link rel="manifest" href="/peloille/manifest.json" />
        <meta name="theme-color" content="#0d0d0d" />
        <link rel="apple-touch-icon" href="/peloille/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/peloille/sw.js').then(
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
