import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "SpaceBio Knowledge Library",
  description: "Search, query, and visualize NASA bioscience research through AI-powered educational manga and coloring books. A modern research tool designed to inspire curiosity and retention.",
  keywords: ["NASA", "bioscience", "research", "education", "manga", "AI", "knowledge library"],
  authors: [{ name: "SpaceBio Research Team" }],
  openGraph: {
    title: "SpaceBio Knowledge Library",
    description: "AI-powered educational research tool with manga-style visualizations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${dmSans.variable} antialiased min-h-screen`}
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-inter), system-ui, sans-serif'
        }}
      >
        <div className="min-h-screen flex flex-col">
          {/* Scientific Grid Background Pattern */}
          <div 
            className="fixed inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(var(--border-subtle) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Main Content */}
          <main className="relative flex-1 z-10">
            {children}
          </main>
          
          {/* Scientific Footer */}
          <footer className="relative z-10 mt-auto">
            <div className="border-t border-[var(--border-subtle)] bg-[var(--background-secondary)]">
              <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-teal)] flex items-center justify-center">
                      <span className="text-sm font-bold text-white">🧬</span>
                    </div>
                    <div>
                      <p className="text-scientific-caption font-semibold">
                        SpaceBio Knowledge Library
                      </p>
                      <p className="text-xs text-[var(--foreground-secondary)]">
                        Powered by AI • Designed for Discovery
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-xs text-[var(--foreground-secondary)]">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-coral)]"></div>
                      Research-Grade AI
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-yellow)]"></div>
                      Educational Focus
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]"></div>
                      Youth-Friendly
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
