import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import ConditionalNavbar from "@/components/ConditionalNavbar";

export const metadata: Metadata = {
  title: "DHUAN | AI Smog & Navigation Platform",
  description: "Predict the Smog. Understand the Risk. Choose the Safer Route.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <ConditionalNavbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
