// Página completa del portafolio (componente de servidor).
// Estructura y textos según design/Portafolio German Lugo.dc.html.
import LangSwitch from '@/components/LangSwitch';
import { getView, type Lang } from '@/lib/content';

export default function Portfolio({ lang }: { lang: Lang }) {
  const v = getView(lang);
  const { t } = v;

  return (
    <>
      <nav aria-label="Principal" className="nav">
        <div className="nav-inner">
          <a href="#top" className="brand">
            <span className="accent">~/</span>german-lugo
          </a>
          <div className="nav-links">
            <a href="#stack" className="nav-link">{t.nav.stack}</a>
            <a href="#experiencia" className="nav-link">{t.nav.experience}</a>
            <a href="#proyectos" className="nav-link">{t.nav.projects}</a>
            <a href="#sobre-mi" className="nav-link">{t.nav.about}</a>
            <a href="#contacto" className="nav-link">{t.nav.contact}</a>
            <a href={v.arcadeUrl} className="nav-link nav-link-arcade">{t.nav.arcade} ↗</a>
            <LangSwitch current={lang} />
          </div>
        </div>
      </nav>

      <main id="top" className="main">
        <header className="hero">
          <div className="hero-copy">
            <div className="prompt">
              <span className="accent">$</span> {t.hero.prompt}
              <span className="cursor" aria-hidden="true" />
            </div>
            <h1 className="h1">{t.hero.name}</h1>
            <p className="tagline">{t.hero.tagline}</p>
            <p className="intro">{t.hero.intro}</p>
            <div className="cta-row">
              <a href="#proyectos" className="btn btn-primary">
                {t.hero.ctaProjects} <span aria-hidden="true">→</span>
              </a>
              {v.cvUrl ? (
                <a href={v.cvUrl} download="German-Lugo-CV.pdf" className="btn btn-ghost">{t.hero.ctaCv}</a>
              ) : (
                <a href="#contacto" className="btn btn-ghost">
                  {t.hero.ctaCv} <span className="pending">{t.pending}</span>
                </a>
              )}
              <a href="#contacto" className="btn btn-ghost">{t.hero.ctaContact}</a>
            </div>
          </div>

          <aside aria-label="Resumen" className="card term">
            <div className="term-head">
              <span>german@toscana:~</span>
              <span>zsh</span>
            </div>
            <div className="term-body">
              <span className="term-k">$ location</span>
              <span className="term-v">{t.hero.location}</span>
              <span className="term-k">$ status</span>
              <span className="term-v term-status">
                <span className="term-dot" aria-hidden="true" />
                {t.hero.availability}
              </span>
              <span className="term-k">$ langs</span>
              <span className="term-v">es · it · en</span>
              <span className="term-k">$ since</span>
              <span className="term-v">2013 · Web3</span>
              <span className="term-k">$ ls ./stack</span>
              <span className="term-v-soft">
                node typescript laravel react next
                <br />
                mongodb mysql prisma docker vercel
              </span>
              <span className="term-k">$ ./arcade</span>
              <span className="term-v">
                <a href={v.arcadeUrl} className="term-link">{t.hero.arcadeLabel} ↗</a>
              </span>
            </div>
          </aside>
        </header>

        <section id="stack" className="section">
          <div className="section-head">
            <span className="num">01</span>
            <h2 className="h2">{t.stack.title}</h2>
          </div>
          <p className="lead">{t.stack.lead}</p>
          <div className="stack-grid">
            {v.stackGroups.map((g) => (
              <div key={g.label} className="card stack-card">
                <div className="stack-label">{'// '}{g.label}</div>
                <ul className="stack-list">
                  {g.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="note"><span className="accent">#</span> {t.stack.aiNote}</p>
        </section>

        <section id="experiencia" className="section">
          <div className="section-head section-head-lg">
            <span className="num">02</span>
            <h2 className="h2">{t.experience.title}</h2>
          </div>
          <article className="exp">
            <div className="exp-side">
              <h3 className="h3">{t.experience.company}</h3>
              <div className="exp-role">{t.experience.role}</div>
              <div className="exp-ctx">{t.experience.context}</div>
              <dl className="exp-dl">
                <dt>{t.experience.periodLabel}</dt>
                <dd className={v.periodPending ? 'is-pending' : undefined}>{v.period}</dd>
                <dt>{t.experience.stackLabel}</dt>
                <dd>{v.experienceStack}</dd>
              </dl>
            </div>
            <div className="exp-main">
              <p className="exp-desc">{t.experience.description}</p>
              <ol className="exp-list">
                {t.experience.contributions.map((c, i) => (
                  <li key={c.title} className="exp-item">
                    <span className="exp-n">0{i + 1}</span>
                    <div className="exp-body">
                      <strong>{c.title}</strong>
                      <span>{c.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        </section>

        <section id="proyectos" className="section">
          <div className="section-head">
            <span className="num">03</span>
            <h2 className="h2">{t.projects.title}</h2>
          </div>
          <p className="lead">{t.projects.lead}</p>
          <div className="proj-grid">
            {v.projects.map((p) => (
              <article key={p.id} className="card proj">
                {p.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.screenshot} alt={p.name} className="proj-shot" loading="lazy" />
                ) : (
                  <div className="proj-shot-empty" aria-hidden="true">
                    {t.projects.labels.screenshot} · <span className="accent">{t.pending}</span>
                  </div>
                )}
                <div className="proj-body">
                  <div className="proj-head">
                    <div className="proj-name">
                      <span className={`proj-kind${p.kind === 'own' ? ' is-own' : ''}`}>{p.kindLabel}</span>
                      <h3 className="proj-title">{p.name}</h3>
                    </div>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener" className="proj-link">{p.domain} ↗</a>
                    )}
                  </div>
                  <p className="proj-problem">{p.problem}</p>
                  <dl className="proj-dl">
                    <dt>{t.projects.labels.role}</dt>
                    <dd>{p.role}</dd>
                    <dt>{t.projects.labels.stack}</dt>
                    <dd className="proj-stack">{p.stack}</dd>
                    <dt>{t.projects.labels.metric}</dt>
                    <dd className="proj-metric">{p.metric}</dd>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="sobre-mi" className="section">
          <div className="section-head section-head-lg">
            <span className="num">04</span>
            <h2 className="h2">{t.about.title}</h2>
          </div>
          <dl className="about-dl">
            {t.about.facts.map((f) => (
              <div key={f.k} style={{ display: 'contents' }}>
                <dt>{f.k}:</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contacto" className="section section-last">
          <div className="section-head">
            <span className="num">05</span>
            <h2 className="h2">{t.contact.title}</h2>
          </div>
          <p className="contact-lead">{t.contact.lead}</p>
          <div className="contact-grid">
            {v.contacts.map((k) => (
              <a
                key={k.label}
                href={k.href}
                target={k.external ? '_blank' : undefined}
                rel={k.external ? 'noopener' : undefined}
                className="card contact-card"
              >
                <span className="contact-label">$ {k.label}</span>
                <span className={`contact-value${k.pending ? ' is-pending' : ''}`}>{k.value}</span>
              </a>
            ))}
          </div>
          <p className="closing">
            <span className="accent">$</span> echo &quot;{t.contact.closing}&quot;
          </p>
        </section>

        <footer className="footer">
          <span>{t.footer}</span>
          <span className="mono">© {v.year} Germán Lugo</span>
        </footer>
      </main>
    </>
  );
}
