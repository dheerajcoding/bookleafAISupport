import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Space_Grotesk } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Space_Grotesk({
  variable: "--font-mono",
  subsets: ["latin"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BookLeaf Author Support Portal",
  description: "Support and communication workspace for BookLeaf authors and admins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
