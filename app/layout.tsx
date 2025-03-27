// app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import './globals.css';

export const metadata: Metadata = {
  title: "Heart Lens",
  description: "Monitor your pulse",
  icons: {
    icon: "/heart.ico"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the entire app with SessionProvider */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}