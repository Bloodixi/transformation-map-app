"use client";

import { cn } from "@/lib/utils";
import TelegramRegisterButton from "@/components/telegram-register-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from 'next-intl';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations('Auth');

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Transformation Map</CardTitle>
          <CardDescription className="text-base">
            Войдите через Telegram для безопасного и быстрого доступа к платформе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">
              {t('whyTelegram')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>{t('benefit1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>{t('benefit2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>{t('benefit3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>{t('benefit4')}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <TelegramRegisterButton variant="default" className="w-full h-12 text-lg" />
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">
                {t('howItWorks')}
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. {t('step1')}</li>
                <li>2. {t('step2')}</li>
                <li>3. {t('step3')}</li>
                <li>4. {t('step4')}</li>
              </ol>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
