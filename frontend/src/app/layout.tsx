
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceDesk | Internal Ticket Management",
  description:
    "Company internal complaint and service request management portal.",
};

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
