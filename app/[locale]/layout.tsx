import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import AnimatedBackground from "@/components/AnimatedBackground";
import "../globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Transformation Map",
  description: "Gamify your journey to a better you.",
};

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  console.log('Layout locale:', locale); // Debug
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider key={locale} messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AnimatedBackground />
            <div className="fixed top-4 right-4 z-50">
              <LanguageSwitcher />
            </div>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}