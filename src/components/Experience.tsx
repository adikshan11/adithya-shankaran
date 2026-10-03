import { experience } from '../content';

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="py-16">
      <h2 id="experience-heading" className="text-2xl font-bold tracking-tight">Experience</h2>
      <article className="card mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{experience.company}</h3>
            <p className="text-sm text-muted">{experience.title}</p>
          </div>
          <p className="font-mono text-xs text-muted">{experience.period} · {experience.location}</p>
        </div>
        <ol className="mt-6 space-y-8 border-l border-line pl-6">
          {experience.roles.map((role) => (
            <li key={role.title} className="relative">
              <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold">
                  {role.title} <span className="font-normal text-muted">· {role.context}</span>
                </h4>
                <p className="font-mono text-xs text-muted">{role.period}</p>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Stack">
                {role.stack.map((item) => <li key={item} className="chip">{item}</li>)}
              </ul>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-[15px] leading-relaxed text-muted marker:text-accent">
                {role.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
