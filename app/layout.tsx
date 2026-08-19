import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WG-Finder",
  description: "Mitbewohner finden. Einfach und barrierearm.",
  icons: {
    icon: "/wg-gemeinsam.jpg",
    shortcut: "/wg-gemeinsam.jpg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
