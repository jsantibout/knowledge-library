import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpaceBio Knowledge Library",
  description:
    "Search, query, and visualize NASA bioscience research with AI-powered educational illustrations",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen`}>
        {/* Calm, lab-like header */}
        <header className="header">
          <div className="container-narrow py-6 sm:py-7">
            <h1 className="h-display">SpaceBio Knowledge Library</h1>
            <p className="h-subtle mt-1">
              A clean research interface to search, query, and visualize bioscience knowledge.
            </p>
          </div>
        </header>

        <main className="pb-16">{children}</main>

        <footer className="border-t border-[var(--card-border)]">
          <div className="container-narrow py-6 text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} SpaceBio • Educational use only
          </div>
        </footer>
      </body>
    </html>
  );
}
