import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["700"], variable: "--font-fredoka" });

export const metadata: Metadata = {
  title: "FUSE - Reading Platform",
  description: "A beautiful manga reading platform powered by Fuse",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${fredoka.variable} font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
