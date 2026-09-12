import Cv from '@/components/Cv';
import Portfolio from '@/components/Portfolio';
import { DEFAULT_LANG, LANGS, isCvRoute, resolveLang } from '@/lib/content';

export const dynamicParams = false;

// Rutas estáticas: "/" (es), "/en/", "/it/" y el CV en "/cv/", "/en/cv/", "/it/cv/".
export function generateStaticParams() {
  return LANGS.flatMap((lang) => {
    const base = lang === DEFAULT_LANG ? [] : [lang];
    return [{ lang: base }, { lang: [...base, 'cv'] }];
  });
}

export default async function Page({ params }: { params: Promise<{ lang?: string[] }> }) {
  const p = await params;
  const lang = resolveLang(p);
  return isCvRoute(p) ? <Cv lang={lang} /> : <Portfolio lang={lang} />;
}
