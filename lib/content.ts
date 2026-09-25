// Acceso tipado a content/content.json y cálculo de los valores derivados
// (placeholders pendientes, periodo, tarjetas de proyecto, contactos).
// Es la traducción de renderVals() del diseño original a funciones puras.
import baseContent from '@/content/content.json';
import variantCommitOffshore from '@/content/variants/commit-offshore.json';

/* Variantes del CV para ofertas concretas: sobreescrituras parciales sobre
   content.json (objetos se combinan, listas se sustituyen). Solo se generan
   como ruta cuando se compila con CV_VARIANT=<id>; nunca en el sitio público. */
export const CV_VARIANTS: Record<string, unknown> = {
  'commit-offshore': variantCommitOffshore,
};
export const ACTIVE_VARIANT: string | null =
  process.env.CV_VARIANT && CV_VARIANTS[process.env.CV_VARIANT] ? process.env.CV_VARIANT : null;

type Content = typeof baseContent;

function deepMerge<T>(base: T, over: unknown): T {
  if (Array.isArray(over)) return over as T;
  if (over && typeof over === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], v);
    }
    return out as T;
  }
  return (over === undefined ? base : over) as T;
}

function contentFor(variant: string | null): Content {
  return variant ? deepMerge(baseContent, CV_VARIANTS[variant]) : baseContent;
}

export type Lang = 'es' | 'en' | 'it';
export const LANGS: Lang[] = ['es', 'en', 'it'];
export const DEFAULT_LANG: Lang = 'es';
export const LANG_STORAGE_KEY = 'gl-portfolio-lang';

export type Texts = Content['es'];
type Placeholders = Content['placeholders'];

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as string[]).includes(v);
}

/** Idioma a partir del segmento opcional de la ruta ([[...lang]]). */
export function resolveLang(params: { lang?: string[] }): Lang {
  const seg = params.lang?.[0];
  return isLang(seg) ? seg : DEFAULT_LANG;
}

/** True si la ruta pedida es el CV: /cv/, /en/cv/, /it/cv/ (o una variante: /en/cv/<id>/). */
export function isCvRoute(params: { lang?: string[] }): boolean {
  const segs = params.lang ?? [];
  return segs[segs.length - 1] === 'cv' || (segs.length >= 2 && segs[segs.length - 2] === 'cv');
}

/** Id de variante del CV en la ruta (/en/cv/<id>/), si existe y está activa. */
export function variantFrom(params: { lang?: string[] }): string | null {
  const segs = params.lang ?? [];
  const id = segs.length >= 2 && segs[segs.length - 2] === 'cv' ? segs[segs.length - 1] : null;
  return id && id === ACTIVE_VARIANT ? id : null;
}

/** Ruta estática de cada idioma: es en la raíz, el resto bajo /xx/. */
export function langPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}/`;
}

function placeholder(content: Content, key: keyof Placeholders): string {
  const v = content.placeholders[key];
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

/** Captura de un proyecto: ruta única o una por idioma ({es,en,it}); si falta la del
    idioma pedido se usa la primera disponible. */
function screenshotFor(content: Content, key: string, lang: Lang): string {
  const v = (content.placeholders as Record<string, unknown>)[key];
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    const byLang = v as Record<string, string>;
    const own = byLang[lang]?.trim();
    if (own) return own;
    for (const l of LANGS) { const alt = byLang[l]?.trim(); if (alt) return alt; }
  }
  return '';
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

export interface JobView {
  id: string;
  company: string;
  role: string;
  context: string;
  period: string;
  description: string;
  highlights: { title: string; text: string }[];
  metric: string;
  stack: string;
  domain: string;
  link: string;
  kind: 'client' | 'employee';
}

export interface View {
  lang: Lang;
  variant: string | null;
  t: Texts;
  stackGroups: { label: string; items: string[] }[];
  jobs: JobView[];
  projects: ProjectView[];
  contacts: ContactView[];
  cvUrl: string;
  arcadeUrl: string;
  year: number;
}

export function getView(lang: Lang, variant: string | null = null): View {
  const content = contentFor(variant);
  const t = content[lang];
  const pending = t.pending;

  // Experiencia: datos por idioma (jobs) + periodo, stack y enlace independientes del idioma.
  const jobs: JobView[] = content.experienceMeta.map((m) => {
    const tx = t.experience.jobs[m.id as keyof typeof t.experience.jobs];
    const link = m.linkKey ? content.links[m.linkKey as keyof typeof content.links] : '';
    return {
      id: m.id,
      company: tx.company,
      role: tx.role,
      context: tx.context,
      period: `${m.start} – ${m.end || t.experience.present}`,
      description: tx.description,
      highlights: tx.highlights,
      metric: tx.metric,
      stack: m.stack.join(' · '),
      domain: m.domain,
      link,
      kind: m.kind as 'client' | 'employee',
    };
  });

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
      screenshot: screenshotFor(content, m.screenshotKey, lang),
      stack: m.stack.join(' · '),
      problem: tx.problem,
      role: tx.role,
      metric: tx.metric,
    };
  });

  const email = placeholder(content, 'EMAIL');
  const github = placeholder(content, 'GITHUB_URL');
  const stripProto = (u: string) => u.replace(/^https?:\/\//, '');
  const contacts: ContactView[] = [
    { label: t.contact.email, value: email || pending, href: email ? `mailto:${email}` : '#contacto', external: false, pending: !email },
    { label: t.contact.web, value: stripProto(content.links.site), href: content.links.site, external: true, pending: false },
    { label: t.contact.linkedin, value: stripProto(content.links.linkedin), href: content.links.linkedin, external: true, pending: false },
    { label: t.contact.github, value: github ? stripProto(github) : pending, href: github || '#contacto', external: !!github, pending: !github },
  ];

  return {
    lang,
    variant,
    t,
    stackGroups: content.stack.map((g) => ({ label: t.stack.groups[g.id as keyof typeof t.stack.groups], items: g.items })),
    jobs,
    projects,
    contacts,
    // CV_URL admite {lang}: "/cv/german-lugo-cv-{lang}.pdf" -> un PDF por idioma.
    cvUrl: placeholder(content, 'CV_URL').replace('{lang}', lang),
    arcadeUrl: content.links.arcade,
    year: new Date().getFullYear(),
  };
}
