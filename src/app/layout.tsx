import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RTLMAC - Real-Time Lending Machine AI Companion",
  description: "AI-powered gateway to Fannie Mae property and lending data. Access loan limits, housing market insights, eligibility checks, and more.",
  keywords: ["Fannie Mae", "mortgage", "loan limits", "housing market", "real estate", "AI assistant"],
  authors: [{ name: "RTLMAC" }],
  openGraph: {
    title: "RTLMAC - Real-Time Lending Machine AI Companion",
    description: "AI-powered gateway to Fannie Mae property and lending data",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
