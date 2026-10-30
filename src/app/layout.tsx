import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI × use-ai",
  description: "A use-ai chat that generates interactive UI with OpenUI Lang.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-openui-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
