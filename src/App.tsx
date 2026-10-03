import Experience from './components/Experience';
import GlassFilter from './components/GlassFilter';
import Navigation from './components/Navigation';
import Projects from './components/Projects';
import SectionHeading from './components/SectionHeading';
import { education, highlights, metrics, profile, skills } from './content';

export default function App() {
  return (
    <>
      <GlassFilter />
      <a href="#top" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60]">
        Skip to content
      </a>
      <Navigation />
      <main id="top" className="mx-auto max-w-3xl px-5 pt-36">
        <section aria-labelledby="name-heading">
          <p className="font-mono text-sm text-accent">{profile.role} · {profile.company}</p>
          <h1 id="name-heading" className="mt-3 text-5xl font-extrabold tracking-tight sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{profile.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/Adithya_Shankaran_Resume.pdf" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90">
              Resume
            </a>
            <a href={`mailto:${profile.email}`} className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-accent">
              Email
            </a>
            {profile.links.map((link) => (
              <a key={link.href} href={link.href} className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-accent">
                {link.label}
              </a>
            ))}
          </div>
          <div className="card mt-12 overflow-hidden">
            <p className="flex items-center gap-2 border-b border-line px-5 py-2.5 font-mono text-xs text-muted">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              run_report.json · status: <span className="text-emerald-500">SUCCEEDED</span>
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.value} className="border-line p-5 not-last:border-r max-sm:nth-2:border-r-0 max-sm:nth-[-n+2]:border-b">
                  <dt className="sr-only">{metric.label}</dt>
                  <dd className="text-3xl font-bold tracking-tight">{metric.value}</dd>
                  <dd className="mt-1 text-xs leading-snug text-muted">{metric.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="about" aria-labelledby="about-heading" className="py-16">
          <SectionHeading id="about-heading" step="01" stage="ingest · about" title="About" />
          {profile.about.map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-2xl leading-relaxed text-muted">{paragraph}</p>
          ))}
        </section>

        <Experience />
        <Projects />

        <section aria-labelledby="skills-heading" className="py-16">
          <SectionHeading id="skills-heading" step="04" stage="toolbox" title="Skills" />
          <dl className="mt-6 space-y-4">
            {skills.map((skill) => (
              <div key={skill.group} className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">{skill.group}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {skill.items.map((item) => <span key={item} className="chip">{item}</span>)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="education-heading" className="grid gap-8 py-16 sm:grid-cols-2">
          <div>
            <h2 id="education-heading" className="text-2xl font-bold tracking-tight">Education</h2>
            <ul className="mt-6 space-y-4">
              {education.map((entry) => (
                <li key={entry.school}>
                  <p className="font-semibold">{entry.school}</p>
                  <p className="text-sm text-muted">{entry.detail}</p>
                  <p className="font-mono text-xs text-muted">{entry.period}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Highlights</h2>
            <ul className="mt-6 list-disc space-y-2 pl-4 text-sm text-muted marker:text-accent">
              {highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="py-16">
          <SectionHeading id="contact-heading" step="05" stage="sink · contact" title="Let’s talk" />
          <p className="mt-4 text-muted">Open to data engineering and data platform roles, especially in Bengaluru, Pune and Hyderabad.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90">
              {profile.email}
            </a>
            {profile.codingProfiles.map((link) => (
              <a key={link.href} href={link.href} className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-accent">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-3xl justify-between border-t border-line px-5 py-8 font-mono text-xs text-muted">
        <span>© 2026 {profile.name}</span>
        <span>{profile.location}</span>
      </footer>
    </>
  );
}
