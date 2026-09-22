// CV en una hoja A4 (ruta /cv/, /en/cv/, /it/cv/). Mismo contenido que la web.
// Estructura según design/CV German Lugo.dc.html. En pantalla lleva una barra
// con descarga del PDF, impresión e idioma; al imprimir solo queda la hoja.
import LangSwitch from '@/components/LangSwitch';
import PrintButton from '@/components/PrintButton';
import { getView, langPath, type Lang } from '@/lib/content';

export default function Cv({ lang }: { lang: Lang }) {
  const v = getView(lang);
  const { t } = v;

  return (
    <div className="cv-screen">
      <div className="cv-toolbar">
        <a href={langPath(lang)} className="cv-back">← {t.cv.back}</a>
        <div className="cv-tools">
          {v.cvUrl && (
            <a href={v.cvUrl} download className="cv-btn cv-btn-primary">{t.cv.download}</a>
          )}
          <PrintButton label={t.cv.print} />
          <LangSwitch current={lang} suffix="cv/" />
        </div>
      </div>

      <article className="cv-page" lang={lang}>
        <div className="cv-main">
          <header className="cv-header">
            <div className="cv-prompt"><span className="cv-accent">$</span> {t.hero.prompt}</div>
            <h1 className="cv-name">{t.hero.name}</h1>
            <div className="cv-tagline">{t.hero.tagline}</div>
          </header>

          <section className="cv-section">
            <h2 className="cv-h2"><span className="cv-num">01</span>{t.experience.title}</h2>
            <div className="cv-row">
              <div>
                <strong className="cv-company">{t.experience.company}</strong>{' '}
                <span className="cv-role">· {t.experience.role}</span>
              </div>
              <span className={`cv-period${v.periodPending ? ' is-pending' : ''}`}>{v.period}</span>
            </div>
            <div className="cv-ctx">{t.experience.context}</div>
            <p className="cv-p">{t.experience.description}</p>
            <ul className="cv-list">
              {t.experience.contributions.map((c, i) => (
                <li key={c.title}>
                  <span className="cv-n">0{i + 1}</span>
                  <span>
                    <strong>{c.title}.</strong> <span className="cv-text">{c.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="cv-stackline">{t.experience.stackLabel}: {v.experienceStack}</div>
          </section>

          <section className="cv-section">
            <h2 className="cv-h2"><span className="cv-num">02</span>{t.projects.title}</h2>
            <div className="cv-projects">
              {v.projects.map((p) => (
                <article key={p.id} className="cv-project">
                  <div className="cv-project-head">
                    <span className="cv-project-name">
                      <strong>{p.name}</strong>
                      <span className={`cv-kind${p.kind === 'own' ? ' is-own' : ''}`}>{p.kindLabel}</span>
                    </span>
                    {p.domain && <span className="cv-domain">{p.domain}</span>}
                  </div>
                  <p className="cv-problem">{p.problem}</p>
                  <div className="cv-project-foot">
                    <span className="cv-project-role">
                      {p.role} <span className="cv-stack">· {p.stack}</span>
                    </span>
                    <span className="cv-metric">▲ {p.metric}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="cv-aside">
          <section className="cv-aside-section">
            <h2>{'// '}{t.contact.title}</h2>
            <ul className="cv-contacts">
              {v.contacts.map((k) => (
                <li key={k.label}>
                  <span className="cv-k">{k.label}</span>
                  {k.pending ? (
                    <span className="cv-v is-pending">{k.value}</span>
                  ) : (
                    <a className="cv-v" href={k.href}>{k.value}</a>
                  )}
                </li>
              ))}
              <li>
                <span className="cv-k">{t.hero.location}</span>
                <span className="cv-v">{t.hero.availability}</span>
              </li>
            </ul>
          </section>

          <section className="cv-aside-section cv-stack-section">
            <h2>{'// '}{t.stack.title}</h2>
            {v.stackGroups.map((g) => (
              <div key={g.label} className="cv-group">
                <div className="cv-group-label">{g.label}</div>
                <div className="cv-group-items">{g.items.join(' · ')}</div>
              </div>
            ))}
          </section>

          <section className="cv-aside-section cv-about-section">
            <h2>{'// '}{t.about.title}</h2>
            <dl className="cv-facts">
              {t.about.facts.map((f) => (
                <div key={f.k} className="cv-fact">
                  <dt>{f.k}:</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </article>
    </div>
  );
}
