import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobOS",
  description: "An end-to-end operating system for job searching."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

