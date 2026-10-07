import { toolkit } from '../content';
import { logoPaths } from '../logos';
import SectionHeading from './SectionHeading';

export default function Toolkit() {
  return (
    <section id="toolkit" aria-labelledby="toolkit-heading" className="py-8">
      <SectionHeading id="toolkit-heading" step="04" title="Toolkit" />
      <div className="mt-6 space-y-3">
        {toolkit.map((row, index) => (
          <div key={row.label} className={`marquee ${index % 2 ? 'marquee-reverse' : ''}`}>
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                className="marquee-group"
                aria-label={copy === 0 ? row.label : undefined}
                aria-hidden={copy === 1 ? 'true' : undefined}
              >
                {row.items.map((name) => (
                  <li key={name} className="card tool">
                    {logoPaths[name] && (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d={logoPaths[name]} />
                      </svg>
                    )}
                    {name}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
