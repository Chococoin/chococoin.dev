'use client';

// Selector de idioma. Son enlaces a las rutas estáticas (/, /en/, /it/) y,
// al pulsar, guardan la preferencia para que la raíz no vuelva a redirigir
// al idioma del navegador.
import { LANGS, LANG_STORAGE_KEY, langPath, type Lang } from '@/lib/content';

// `suffix` permite usar el selector en subrutas (p. ej. "cv/" -> /en/cv/).
export default function LangSwitch({ current, suffix = '' }: { current: Lang; suffix?: string }) {
  const remember = (lang: Lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* almacenamiento bloqueado: la ruta ya lleva el idioma */
    }
  };
  return (
    <div role="group" aria-label="Idioma" className="lang-group">
      {LANGS.map((lang) => (
        <a
          key={lang}
          href={langPath(lang) + suffix}
          hrefLang={lang}
          aria-current={lang === current ? 'page' : undefined}
          className={`lang-btn${lang === current ? ' active' : ''}`}
          onClick={() => remember(lang)}
        >
          {lang}
        </a>
      ))}
    </div>
  );
}
