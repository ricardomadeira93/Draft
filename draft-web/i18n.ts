import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

export const locales = ['en', 'pt'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  let messages;
  if (locale === 'pt') {
    messages = (await import('./messages/pt.json')).default;
  } else {
    messages = (await import('./messages/en.json')).default;
  }

  return {
    locale: locale as string,
    messages
  };
});
