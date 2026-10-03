import resumeUrl from '../Adithya_Shankaran_Resume.pdf?url';
import Navigation from './components/Navigation';
import Experience from './components/Experience';
import Projects from './components/Projects';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#top">Skip to content</a>
      <Navigation />
      <main id="top" tabIndex={-1}>
        <section className="hero" aria-labelledby="name-heading">
          <h1 id="name-heading">Adithya Shankaran</h1>
          <p className="hero-role">Data engineer at Xebia.</p>
          <p className="intro">I build and operate data pipelines on Google Cloud, working across
            Spark, BigQuery and dbt. My focus is shared infrastructure, data reliability,
            and AI tools that help people work with complex systems.</p>
          <div className="hero-links">
            <a className="resume-link" href={resumeUrl}>Resume</a>
            <a href="https://github.com/adikshan11">GitHub</a>
            <a href="https://www.linkedin.com/in/adithya-shankaran">LinkedIn</a>
            <a href="mailto:adikshan11@gmail.com">Email</a>
          </div>
          <p className="current-work"><strong>At work</strong> I’m consolidating reusable Spark pipeline
            components and improving timeout handling and data-quality checks for a retail data platform.</p>
          <p className="personal-note">Away from the terminal, I play keys. I won KIIT’s K-STAR instrumental music competition.</p>
        </section>
        <Experience />
        <Projects />
        <section className="section" aria-labelledby="toolkit-heading">
          <h2 id="toolkit-heading">Toolkit</h2>
          <dl className="toolkit">
            <div><dt>Data</dt><dd>Python, SQL, Apache Spark, dbt, Delta Lake, Databricks, CDC, Airflow</dd></div>
            <div><dt>Cloud</dt><dd>BigQuery, Dataproc, Vertex AI Pipelines, Dataplex, Datastream, Pub/Sub</dd></div>
            <div><dt>AI &amp; tooling</dt><dd>LLMs, RAG, vector databases, GitHub Copilot, MCP, Docker, Terraform, CI/CD</dd></div>
          </dl>
        </section>
        <section id="contact" className="section contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Get in touch</h2>
          <p>Open to data engineering and data platform roles in Bengaluru, Pune and Hyderabad.</p>
          <a className="email-link" href="mailto:adikshan11@gmail.com">adikshan11@gmail.com</a>
          <div className="other-links">
            <a href="https://leetcode.com/u/adikshan11/">LeetCode</a>
            <a href="https://www.codechef.com/users/adithyashan_11">CodeChef</a>
          </div>
        </section>
      </main>
      <footer><span>© {new Date().getFullYear()} Adithya Shankaran</span><span>B.Tech CSCE · KIIT</span></footer>
    </>
  );
}