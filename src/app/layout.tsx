import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat, Newsreader } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const ui = Bricolage_Grotesque({
  variable: "--font-ui",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const handwriting = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
});

const document_ = Newsreader({
  variable: "--font-document",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Roast My Resume",
  description: "Drop in your resume. Get roasted, then fixed.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${ui.variable} ${document_.variable} ${handwriting.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        {/* Worn-ink edge for the rubber stamp. */}
        <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
