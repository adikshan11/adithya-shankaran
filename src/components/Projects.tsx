import { projects } from '../content';
import SectionHeading from './SectionHeading';

export default function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="py-8">
      <SectionHeading id="projects-heading" step="03" title="Projects" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <article key={project.name} className="card lift flex flex-col gap-3 p-5">
            {project.image && (
              <div className="laptop" aria-hidden="true">
                <div className="laptop-screen">
                  <img src={project.image.src} alt="" width="1440" height="900" loading="lazy" decoding="async" />
                </div>
                <div className="laptop-base" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="flex-1 text-sm leading-relaxed text-muted">{project.summary}</p>
              <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
                {project.stack.map((item) => <li key={item} className="chip">{item}</li>)}
              </ul>
              <div className="flex gap-4 text-sm font-semibold">
                {project.links.map((link) => (
                  <a key={link.href} href={link.href} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                    {link.label} →
                  </a>
                ))}
                {project.note && <span className="font-normal text-muted">{project.note}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
