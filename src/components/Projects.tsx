import { projects } from '../content';

export default function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="py-16">
      <h2 id="projects-heading" className="text-2xl font-bold tracking-tight">Projects</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.name}
            className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent"
          >
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
          </article>
        ))}
      </div>
    </section>
  );
}
