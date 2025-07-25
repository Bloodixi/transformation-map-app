import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['ru', 'en'],
 
  // Used when no locale matches
  defaultLocale: 'ru'
});
 
// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} = routing;