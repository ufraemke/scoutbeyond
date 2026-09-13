import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScoutBeyond — Cross-Industry Technology Intelligence",
  description:
    "Discover transferable physical technologies beyond your industry with empirical rigor and traceable evidence.",
  icons: {
    icon: [{ url: "/Favicon ScoutBeyond.png", type: "image/png" }],
    shortcut: "/Favicon ScoutBeyond.png",
    apple: "/Favicon ScoutBeyond.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
