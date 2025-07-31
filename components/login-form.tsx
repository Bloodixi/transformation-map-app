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
          <CardTitle className="text-3xl">🗺️ Transformation Map</CardTitle>
          <CardDescription className="text-base">
            Войдите через Telegram для безопасного и быстрого доступа к платформе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span>🤖</span> Почему через Telegram?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Быстрая авторизация без паролей</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Безопасность через проверенный аккаунт</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Уведомления о прогрессе прямо в Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Доступ ко всем функциям платформы</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <TelegramRegisterButton variant="default" className="w-full h-12 text-lg" />
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                📋 Как это работает:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Нажмите кнопку "Войти через Telegram"</li>
                <li>2. Откроется Telegram бот - нажмите "Start"</li>
                <li>3. Бот отправит ссылку для входа</li>
                <li>4. Перейдите по ссылке для завершения</li>
              </ol>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
