import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transformation Map",
  description: "Gamify your journey to a better you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}