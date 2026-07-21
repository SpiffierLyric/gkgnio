import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "spiffiergames.io";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: { default: "Spiffier Games", template: "%s — Spiffier Games" },
    description: "Host sharp, simple social games for friends in Discord voice chat.",
    openGraph: {
      title: "Spiffier Games",
      description: "A no-nonsense multiplayer game desk for Discord nights.",
      type: "website",
      images: [{ url: imageUrl, width: 1734, height: 909, alt: "Spiffier Games — Good games. Bad guesses." }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
