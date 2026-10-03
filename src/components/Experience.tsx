import { experience, tenure } from '../content';
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
          <p className="font-mono text-xs text-muted" suppressHydrationWarning>
            {tenure(experience.start)} · {experience.location}
          </p>
        </div>
        <ol className="mt-7 space-y-7 border-l border-line pl-5">
          {experience.roles.map((role) => (
            <li key={role.title} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
              <h4 className="font-semibold">
                {role.title} <span className="font-normal text-muted">· {role.context}</span>
              </h4>
              <p className="font-mono text-xs text-muted" suppressHydrationWarning>{tenure(role.start)}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[15px] leading-relaxed text-muted marker:text-accent">
                {role.points.map((point) => (
                  <li key={point.topic}>
                    <strong className="font-semibold text-ink">{point.topic}</strong>: {point.text}
                  </li>
                ))}
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
