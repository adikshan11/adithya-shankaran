import { experience, tenure } from '../content';
import { XebiaMark } from './Icons';
import SectionHeading from './SectionHeading';

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="pt-14 pb-8">
      <SectionHeading id="experience-heading" step="01" title="Experience" />
      <article className="card mt-6 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <XebiaMark className="size-12 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">{experience.company}</h3>
            <p className="text-sm" suppressHydrationWarning>
              {experience.title} · {tenure(experience.start).split(' · ')[1]}
            </p>
            <p className="text-xs text-muted">{experience.location}</p>
          </div>
        </div>
        <ol className="mt-6 ml-6 space-y-7 border-l border-line pl-5">
          {experience.roles.map((role) => (
            <li key={role.title} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-accent ring-4 ring-card" aria-hidden="true" />
              <h4 className="text-[15px] font-semibold">{role.title} <span className="font-normal text-muted">· {role.context}</span></h4>
              <p className="text-xs text-muted" suppressHydrationWarning>{tenure(role.start, role.end)}</p>
              <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted marker:text-accent">
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
