import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ernest of Gaia Library",
  description:
    "An AI-powered resume and portfolio for Ernest — educator, learning architect, and AI integrationist.",
  openGraph: {
    title: "Ernest of Gaia Library",
    description:
      "An AI-powered resume and portfolio for Ernest — educator, learning architect, and AI integrationist.",
    url: "https://resume.ernestofgaia.xyz",
    siteName: "Ernest of Gaia Library",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
