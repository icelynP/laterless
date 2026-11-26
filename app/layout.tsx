import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Laterless — Stop saving for later. Start doing.",
  description: "Turn saved links into small, practical actions.",
  manifest: "/manifest.json",
  themeColor: "#F7F6F1"
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}