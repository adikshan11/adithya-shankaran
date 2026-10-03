import { experience, tenure } from '../content';
import SectionHeading from './SectionHeading';

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="pt-14 pb-8">
      <SectionHeading id="experience-heading" step="01" title="Experience" />
      <article className="card mt-6 p-6 sm:p-8">
        <h3 className="text-3xl font-extrabold tracking-tight">{experience.company}</h3>
        <p className="mt-1 font-medium" suppressHydrationWarning>
          {experience.title} · {tenure(experience.start).split(' · ')[1]}
        </p>
        <p className="font-mono text-xs text-muted">{experience.location}</p>
        <ol className="mt-7 space-y-8 border-l border-line pl-5">
          {experience.roles.map((role) => (
            <li key={role.title} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
              <h4 className="text-lg font-semibold">{role.title}</h4>
              <p className="text-sm text-muted">{role.context}</p>
              <p className="font-mono text-xs text-muted" suppressHydrationWarning>{tenure(role.start, role.end)}</p>
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
