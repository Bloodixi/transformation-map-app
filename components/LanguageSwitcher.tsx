'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<string>('ru');
  
  // Определяемся с переводами статично, так как это только для кнопок
  const translations = {
    ru: { russian: 'Русский', english: 'English' },
    en: { russian: 'Русский', english: 'English' }
  };

  useEffect(() => {
    // Определяем локаль из URL
    const segments = pathname.split('/');
    const localeFromPath = segments[1];
    if (['ru', 'en'].includes(localeFromPath)) {
      setCurrentLocale(localeFromPath);
    }
  }, [pathname]);

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // Строим новый путь с локалью
    const segments = pathname.split('/');
    const currentPath = segments.slice(2).join('/'); // убираем локаль
    const newPath = `/${newLocale}${currentPath ? `/${currentPath}` : ''}`;
    
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="relative flex items-center justify-between w-auto min-w-[80px] bg-black border border-gray-600 rounded-lg px-3 py-2 text-left text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
        >
          <span className="block truncate font-medium">
            {currentLocale === 'ru' ? 'Русский' : 'English'}
          </span>
          <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start"
        side="bottom"
        sideOffset={4}
        className="z-10 max-h-60 overflow-auto rounded-md bg-black border border-gray-600 py-1 text-base shadow-lg focus:outline-none w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuItem 
          onClick={() => switchLocale('ru')}
          className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-800 ${
            currentLocale === 'ru' ? 'bg-gray-700 text-blue-400 font-medium' : 'text-white'
          }`}
        >
          <span className="block truncate">
            {translations[currentLocale as keyof typeof translations].russian}
          </span>
          {currentLocale === 'ru' && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLocale('en')}
          className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-800 ${
            currentLocale === 'en' ? 'bg-gray-700 text-blue-400 font-medium' : 'text-white'
          }`}
        >
          <span className="block truncate">
            {translations[currentLocale as keyof typeof translations].english}
          </span>
          {currentLocale === 'en' && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}