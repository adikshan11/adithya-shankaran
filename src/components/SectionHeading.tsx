type Props = {
  id: string;
  step: string;
  stage: string;
  title: string;
};

export default function SectionHeading({ id, step, stage, title }: Props) {
  return (
    <>
      <p className="font-mono text-xs text-muted">
        <span className="mr-2 text-accent">{step}</span>
        {stage}
      </p>
      <h2 id={id} className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
    </>
  );
}
