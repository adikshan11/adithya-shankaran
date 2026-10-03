import { metrics, principles } from '../content';
import Rich from './Rich';
import SectionHeading from './SectionHeading';

export default function Principles() {
  return (
    <section id="principles" aria-labelledby="principles-heading" className="py-8">
      <SectionHeading id="principles-heading" step="02" title="How I build" />
      <p className="mt-3 text-muted">Six rules I work by, each one learned on a real pipeline, and what they added up to.</p>
      <dl className="card mt-6 grid grid-cols-2 overflow-hidden sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.value} className="border-line p-5 not-last:border-r max-sm:nth-2:border-r-0 max-sm:nth-[-n+2]:border-b">
            <dt className="sr-only">{metric.label}</dt>
            <dd className="text-3xl font-bold tracking-tight">{metric.value}</dd>
            <dd className="mt-1 text-xs leading-snug text-muted">{metric.label}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
