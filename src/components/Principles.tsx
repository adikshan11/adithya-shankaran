import { principles } from '../content';
import Rich from './Rich';
import SectionHeading from './SectionHeading';

export default function Principles() {
  return (
    <section id="principles" aria-labelledby="principles-heading" className="py-8">
      <SectionHeading id="principles-heading" step="03" title="How I build" />
      <p className="mt-3 text-muted">Six rules I work by, each one learned on a real pipeline or tool.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {principles.map((principle) => (
          <article key={principle.title} className="card p-5">
            <p className="font-mono text-xs text-accent uppercase">{principle.kind}</p>
            <h3 className="mt-1.5 font-semibold">{principle.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted"><Rich text={principle.text} /></p>
          </article>
        ))}
      </div>
    </section>
  );
}
