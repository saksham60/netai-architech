import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetAI Architect",
  description: "GenAI network architecture design tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
