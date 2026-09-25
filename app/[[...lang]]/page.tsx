import Cv from '@/components/Cv';
import Portfolio from '@/components/Portfolio';
import { ACTIVE_VARIANT, DEFAULT_LANG, LANGS, isCvRoute, resolveLang, variantFrom } from '@/lib/content';

export const dynamicParams = false;

// Rutas estáticas: "/" (es), "/en/", "/it/" y el CV en "/cv/", "/en/cv/", "/it/cv/".
// Con CV_VARIANT=<id> se añade "/en/cv/<id>/" (solo para generar PDFs privados).
export function generateStaticParams() {
  const params = LANGS.flatMap((lang) => {
    const base = lang === DEFAULT_LANG ? [] : [lang];
    return [{ lang: base }, { lang: [...base, 'cv'] }];
  });
  if (ACTIVE_VARIANT) params.push({ lang: ['en', 'cv', ACTIVE_VARIANT] });
  return params;
}

export default async function Page({ params }: { params: Promise<{ lang?: string[] }> }) {
  const p = await params;
  const lang = resolveLang(p);
  return isCvRoute(p) ? <Cv lang={lang} variant={variantFrom(p)} /> : <Portfolio lang={lang} />;
}
