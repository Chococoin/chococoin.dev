// Acceso tipado a content/content.json y cálculo de los valores derivados
// (placeholders pendientes, periodo, tarjetas de proyecto, contactos).
// Es la traducción de renderVals() del diseño original a funciones puras.
import content from '@/content/content.json';

export type Lang = 'es' | 'en' | 'it';
export const LANGS: Lang[] = ['es', 'en', 'it'];
export const DEFAULT_LANG: Lang = 'es';
export const LANG_STORAGE_KEY = 'gl-portfolio-lang';

export type Texts = (typeof content)['es'];
type Placeholders = typeof content.placeholders;

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as string[]).includes(v);
}

/** Idioma a partir del segmento opcional de la ruta ([[...lang]]). */
export function resolveLang(params: { lang?: string[] }): Lang {
  const seg = params.lang?.[0];
  return isLang(seg) ? seg : DEFAULT_LANG;
}

/** True si la ruta pedida es el CV: /cv/, /en/cv/, /it/cv/. */
export function isCvRoute(params: { lang?: string[] }): boolean {
  const segs = params.lang ?? [];
  return segs[segs.length - 1] === 'cv';
}

/** Ruta estática de cada idioma: es en la raíz, el resto bajo /xx/. */
export function langPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}/`;
}

function placeholder(key: keyof Placeholders): string {
  const v = content.placeholders[key];
  return v && v.trim() ? v.trim() : '';
}

export type ProjectKind = 'own' | 'client';

export interface ProjectView {
  id: string;
  name: string;
  kind: ProjectKind;
  kindLabel: string;
  domain: string;
  link: string;
  screenshot: string;
  stack: string;
  problem: string;
  role: string;
  metric: string;
}

export interface ContactView {
  label: string;
  value: string;
  href: string;
  external: boolean;
  pending: boolean;
}

export interface View {
  lang: Lang;
  t: Texts;
  stackGroups: { label: string; items: string[] }[];
  experienceStack: string;
  period: string;
  periodPending: boolean;
  projects: ProjectView[];
  contacts: ContactView[];
  cvUrl: string;
  arcadeUrl: string;
  year: number;
}

export function getView(lang: Lang): View {
  const t = content[lang];
  const pending = t.pending;

  const start = placeholder('FOODCHAIN_INICIO');
  const end = placeholder('FOODCHAIN_FIN');
  const periodPending = !start && !end;
  const period = periodPending ? pending : `${start || pending} – ${end || pending}`;

  const projects: ProjectView[] = content.projectsMeta.map((m) => {
    const tx = t.projects.items[m.id as keyof typeof t.projects.items];
    const link = m.linkKey ? content.links[m.linkKey as keyof typeof content.links] : '';
    const kind = m.kind as ProjectKind;
    return {
      id: m.id,
      name: m.name,
      kind,
      kindLabel: t.projects.labels[kind],
      domain: m.domain,
      link,
      screenshot: placeholder(m.screenshotKey as keyof Placeholders),
      stack: m.stack.join(' · '),
      problem: tx.problem,
      role: tx.role,
      metric: tx.metric,
    };
  });

  const email = placeholder('EMAIL');
  const github = placeholder('GITHUB_URL');
  const stripProto = (u: string) => u.replace(/^https?:\/\//, '');
  const contacts: ContactView[] = [
    { label: t.contact.email, value: email || pending, href: email ? `mailto:${email}` : '#contacto', external: false, pending: !email },
    { label: t.contact.linkedin, value: stripProto(content.links.linkedin), href: content.links.linkedin, external: true, pending: false },
    { label: t.contact.github, value: github ? stripProto(github) : pending, href: github || '#contacto', external: !!github, pending: !github },
  ];

  return {
    lang,
    t,
    stackGroups: content.stack.map((g) => ({ label: t.stack.groups[g.id as keyof typeof t.stack.groups], items: g.items })),
    experienceStack: content.experienceStack.join(' · '),
    period,
    periodPending,
    projects,
    contacts,
    // CV_URL admite {lang}: "/cv/german-lugo-cv-{lang}.pdf" -> un PDF por idioma.
    cvUrl: placeholder('CV_URL').replace('{lang}', lang),
    arcadeUrl: content.links.arcade,
    year: new Date().getFullYear(),
  };
}
