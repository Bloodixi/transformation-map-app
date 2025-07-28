"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TelegramLogin from "@/components/telegram-login";
import { useTranslations } from 'next-intl';

export function TelegramLoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations('Auth');
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('welcomeTitle')}</CardTitle>
          <CardDescription>
            {t('welcomeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="w-full flex justify-center">
              <TelegramLogin />
            </div>
            
            <div className="text-center text-sm text-muted-foreground max-w-sm">
              {t('agreementText')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}