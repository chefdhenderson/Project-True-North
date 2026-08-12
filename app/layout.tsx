import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project True North — Wild Fork Canada",
  description: "Merchant Command dashboard for the Wild Fork Canada business unit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
