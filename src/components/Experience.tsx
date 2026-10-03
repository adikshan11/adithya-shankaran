import { experience } from '../content';
import SectionHeading from './SectionHeading';

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="py-8">
      <SectionHeading id="experience-heading" step="02" stage="transform · experience" title="Experience" />
      <article className="card mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight">{experience.company}</h3>
            <p className="mt-1 font-medium">{experience.title}</p>
          </div>
          <p className="font-mono text-xs text-muted">{experience.period} · {experience.location}</p>
        </div>
        <ol className="mt-7 space-y-6 border-l border-line pl-5">
          {experience.roles.map((role) => (
            <li key={role.title} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h4 className="text-sm font-semibold">
                  {role.title} <span className="font-normal text-muted">· {role.context}</span>
                </h4>
                <p className="font-mono text-xs text-muted">{role.period}</p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted marker:text-accent">
                {role.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Stack">
                {role.stack.map((item) => <li key={item} className="chip">{item}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
