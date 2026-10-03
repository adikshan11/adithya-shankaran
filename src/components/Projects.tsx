const projects = [
  {
    name: 'Underwriting Risk Assessment',
    description: 'An underwriting risk application built in Xebia’s X-AI Practitioner+ program, using custom Copilot agents, skills and review workflows.',
    stack: 'Python, LLMs, GitHub Copilot',
    note: 'Team project · code not publicly linked',
  },
  {
    name: 'IaC Linter',
    description: 'Checks Terraform for security issues and AWS Well-Architected gaps, then applies proposed fixes with backups.',
    stack: 'Python, AWS Bedrock, Terraform',
    href: 'https://github.com/XI4684-AdithyaShankaran/Iac-Linter',
    link: 'Source code',
  },
  {
    name: 'Bookmark’d',
    description: 'Book discovery platform built with a four-member team. I developed search, reviews and JWT login in React over a PostgreSQL and Redis backend.',
    stack: 'React, PostgreSQL, Redis',
    href: 'https://bkmrkd-frontend.vercel.app',
    link: 'Live site',
  },
  {
    name: 'Lakehouse Quality Agent',
    description: 'A reproducible engineering demo of idempotent ingestion, rejected-record quarantine and validated dbt test proposals. Uses public NYC taxi data, not an industry deployment.',
    stack: 'PySpark, Delta Lake, dbt',
    href: 'https://github.com/adikshan11/lakehouse-dq-agent',
    link: 'Source code',
  },
];

export default function Projects() {
  return (
    <section id="projects" className="section" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Selected projects</h2>
      <div className="project-list">
        {projects.map(project => (
          <article className="project" key={project.name}>
            <div className="project-heading">
              <h3>{project.name}</h3>
              {project.href && <a href={project.href} aria-label={`${project.name}: ${project.link}`}>{project.link}</a>}
            </div>
            <p>{project.description}</p>
            <p className="project-stack">{project.stack}</p>
            {project.note && <p className="project-note">{project.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}