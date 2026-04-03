import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolved Pros AI Avatar Platform",
  description: "Turn podcast episodes into AI-generated short-form video clips",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans overflow-x-auto">{children}</body>
    </html>
  );
}
