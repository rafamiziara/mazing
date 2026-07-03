import type { Metadata, Viewport } from "next";
import { Cinzel, Alegreya_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cinzel",
});

const alegreya = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-alegreya",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "mazing — carry your light through the maze",
  description:
    "You are an ember of light in a maze that never ends. The flame burns down, sparks rekindle it, a red thread marks the way. mazing is a game of procedural mazes, light and memory.",
  metadataBase: new URL("https://mazing.game"),
  openGraph: {
    title: "mazing",
    description: "Carry your light through the maze.",
    images: ["/logo.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0b1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${alegreya.variable} ${plexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
