import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations, getLocale } from 'next-intl/server';

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'HomePage'});

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center relative">
      <AnimatedBackground />
      <div className="flex flex-col items-center gap-8 p-8 z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground">
          {t('title')}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
          {t('subtitle')}
        </p>
        <Link href={`/${locale}/auth/login`}>
          <Button size="lg">{t('startButton')}</Button>
        </Link>
      </div>
    </main>
  );
}