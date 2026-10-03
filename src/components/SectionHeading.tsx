type Props = {
  id: string;
  step: string;
  title: string;
};

export default function SectionHeading({ id, step, title }: Props) {
  return (
    <h2 id={id} className="flex items-baseline gap-3 text-2xl font-bold tracking-tight">
      <span className="font-mono text-sm font-medium text-accent">{step}</span>
      {title}
    </h2>
  );
}
