import Experience from './components/Experience';
import Navigation from './components/Navigation';
import PianoKeys from './components/PianoKeys';
import Principles from './components/Principles';
import Projects from './components/Projects';
import Rich from './components/Rich';
import SectionHeading from './components/SectionHeading';
import SocialLinks from './components/SocialLinks';
import StatusBoard from './components/StatusBoard';
import Toolkit from './components/Toolkit';
import { profile } from './content';

export default function App() {
  return (
    <>
      <a href="#top" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60]">
        Skip to content
      </a>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
      </div>
      <Navigation />
      <main id="top" className="segment mx-auto max-w-5xl px-5 pt-32">
        <section aria-labelledby="name-heading">
          <p className="font-mono text-sm text-accent">{profile.role} · {profile.company}</p>
          <h1 id="name-heading" className="mt-3 text-[clamp(1.6rem,4.2vw,2.4rem)] leading-tight font-bold tracking-tight">
            {profile.headline.map((part, index) => (
              <span key={part} className={index % 2 ? 'text-accent' : undefined}>{part}</span>
            ))}
          </h1>
          {profile.intro.map((paragraph, index) => (
            <p key={paragraph} className={`relative leading-relaxed text-muted ${index === 0 ? 'mt-4 text-lg' : 'mt-3'}`}>
              <Rich text={paragraph} slots={{ piano: <PianoKeys /> }} />
            </p>
          ))}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="/Adithya_Shankaran_Resume.pdf" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper transition hover:opacity-90">
              Resume
            </a>
            <SocialLinks />
          </div>
          <StatusBoard />
        </section>

        <Experience />
        <Principles />
        <Projects />
        <Toolkit />

        <section id="contact" aria-labelledby="contact-heading" className="py-8">
          <SectionHeading id="contact-heading" step="05" title="Let’s connect" />
          <p className="mt-3 text-muted">Open to data engineering and data platform roles: on-site, hybrid or remote. Email reaches me fastest.</p>
          <ul className="mt-5 space-y-2.5">
            {profile.socials.map((social) => (
              <li key={social.label} className="flex flex-wrap gap-x-2">
                <span className="w-20 font-semibold">{social.label}</span>
                <a
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="text-accent hover:underline"
                >
                  {social.handle}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="segment mx-auto flex max-w-5xl flex-wrap justify-between gap-2 border-t border-line px-5 py-8 font-mono text-xs text-muted">
        <span>© 2026 {profile.name}</span>
        <span>{profile.location}</span>
      </footer>
    </>
  );
}
