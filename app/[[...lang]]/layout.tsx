// Layout raíz. Vive bajo [[...lang]] para poder poner el idioma correcto en
// <html lang>: "/" es español, "/en/" y "/it/" los otros dos.
import type { Metadata, Viewport } from 'next';
import { Fira_Code, Manrope } from 'next/font/google';
import { DEFAULT_LANG, LANGS, LANG_STORAGE_KEY, isCvRoute, langPath, resolveLang } from '@/lib/content';
import content from '@/content/content.json';
import '@/app/globals.css';
import '@/app/cv.css';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-sans', display: 'swap' });
const firaCode = Fira_Code({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

const SITE = 'https://chococoin.dev';

type Params = { lang?: string[] };

export const viewport: Viewport = { themeColor: '#0E0F12' };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const lang = resolveLang(p);
  const cv = isCvRoute(p);
  const meta = content[lang].meta;
  const title = cv ? content[lang].cv.title : meta.title;
  const suffix = cv ? 'cv/' : '';
  return {
    metadataBase: new URL(SITE),
    title,
    description: meta.description,
    alternates: {
      canonical: langPath(lang) + suffix,
      languages: Object.fromEntries(LANGS.map((l) => [l, langPath(l) + suffix])),
    },
    openGraph: { title, description: meta.description, url: langPath(lang) + suffix, locale: lang, type: 'website' },
  };
}

// En la raíz (español) redirige una sola vez al idioma preferido: el guardado
// por el selector o, si no hay, el del navegador (en / it). Inline y síncrono
// para que ocurra antes del primer pintado.
const redirectScript = `(function(){try{if(location.pathname!=='/')return;var s=localStorage.getItem('${LANG_STORAGE_KEY}');var n=(s||navigator.language||'').slice(0,2).toLowerCase();if(!s&&n!=='en'&&n!=='it')return;if(n==='en'||n==='it')location.replace('/'+n+'/'+location.hash);}catch(e){}})();`;

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<Params> }) {
  const lang = resolveLang(await params);
  return (
    <html lang={lang} className={`${manrope.variable} ${firaCode.variable}`}>
      <head>
        {lang === DEFAULT_LANG && <script dangerouslySetInnerHTML={{ __html: redirectScript }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
