export default function Experience() {
  return (
    <section id="experience" className="section" aria-labelledby="experience-heading">
      <h2 id="experience-heading">Experience</h2>
      <article className="experience">
        <div className="experience-heading">
          <div><h3>Xebia</h3><p>Junior Consultant · Data Engineer</p></div>
          <p className="dates">Aug 2024 – present<br />Gurugram, India</p>
        </div>
        <div className="role">
          <h4>Retail data platform</h4>
          <p className="dates">Client engagement · Sep 2025 – present</p>
          <ul>
            <li>Moving legacy ingestion to Spark on Google Cloud and BigQuery, validating results against the original pipelines.</li>
            <li>Consolidating Dataproc pipeline components into a reusable framework, with execution limits and failure reporting.</li>
            <li>Investigating source freshness, validating dbt backfills, and integrating Dataplex quality checks into CI.</li>
            <li>Improving expensive Spark workloads through join and partition pruning.</li>
          </ul>
        </div>
        <div className="role">
          <h4>Generative AI &amp; developer tools</h4>
          <p className="dates">Aug 2024 – present</p>
          <ul>
            <li>Built RAG and structured extraction tools for resumes and bank statements using LLMs and vector databases.</li>
            <li>Built a Terraform analyzer using AWS Bedrock to identify security and architecture gaps.</li>
            <li>Work with Copilot custom agents, skills and MCP-assisted workflows; selected for Xebia’s Forward Deployed Engineer program.</li>
          </ul>
        </div>
      </article>
    </section>
  );
}