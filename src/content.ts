export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Gurugram, Haryana',
  email: 'adikshan11@gmail.com',
  headline: ['Building the ', 'data foundations', ' that ', 'analytics and AI', ' run on.'],
  intro: [
    'I’m a data engineer at **Xebia**. I build and run the Google Cloud pipelines behind a global apparel retail brand’s **sales and demand reporting**, and I work directly with the product owners and **BI analysts** who depend on it.',
    'Lately that has meant getting the marketing team’s dashboard **complete again** after a field went missing, making stuck jobs **fail and alert** instead of reporting success, and moving **524 production schedules** onto one shared Dataproc component. I also build **RAG** and **LangGraph** agents, at work and in **imaarat.ai**.',
    'Away from pipelines I play the [piano], rep Real Madrid, and lose more hours to Minecraft than I should.',
  ],
  status: [
    { label: 'Live', text: 'Just shipped DQ enforcement in the shared pipeline framework: data-quality and profile scans now carry each table’s domain labels' },
    { label: 'Certified', text: 'Xebia Forward Deployed Engineer, FDE-1 Level 2 on GCP, October 2026' },
  ],
  socials: [
    { label: 'Email', handle: 'adikshan11@gmail.com', href: 'mailto:adikshan11@gmail.com', icon: 'mail' },
    { label: 'LinkedIn', handle: 'adithya-shankaran', href: 'https://www.linkedin.com/in/adithya-shankaran', icon: 'linkedin' },
    { label: 'GitHub', handle: '@adikshan11', href: 'https://github.com/adikshan11', icon: 'github' },
    { label: 'X', handle: '@adithyashan11', href: 'https://x.com/adithyashan11', icon: 'x' },
  ] as const,
  coding: [
    { label: 'LeetCode', href: 'https://leetcode.com/u/adikshan11/', icon: 'leetcode' },
    { label: 'CodeChef', href: 'https://www.codechef.com/users/adithyashan_11', icon: 'codechef' },
  ] as const,
};

export type Role = {
  title: string;
  context: string;
  start: string;
  end?: string;
  stack: string[];
  points: { topic: string; text: string }[];
};

export const experience = {
  company: 'Xebia',
  title: 'Full-time',
  start: '2024-08',
  location: 'Gurugram, India',
  roles: [
    {
      title: 'Junior Consultant, Data Engineer',
      context: 'Client engagement · Global apparel retail brand',
      start: '2026-07',
      stack: ['Dataproc', 'Vertex AI', 'BigQuery', 'DBT', 'Dataplex'],
      points: [
        { topic: 'Data correctness', text: 'The site marketing team’s twice-weekly dashboard lost its campaign field in September 2026. I fixed the pipeline and ran a chained dbt backfill over 6 months of events, repairing 1,455 records, so their reports are complete again.' },
        { topic: 'Silent failures', text: 'Batches stopped at the 4-hour Dataproc limit were still reported as successful. I added time limits to 600+ DAGs, sized from each job’s worst recent runs, so a timed-out job now fails and raises an alert.' },
        { topic: 'Pipeline framework', text: 'Owned per-task time limits in the shared Vertex AI pipeline framework: each limit comes from measured run times, and the alert names the task that failed. Live on 59 tasks across 25 e-commerce pipelines.' },
        { topic: 'Cost', text: 'A high-cost Hybris Spark pipeline was cancelled at the 4-hour limit on 9 of 9 days. After I pruned its lookup joins and partition scans, 11 of 16 runs succeeded and daily cost fell 19.7%. I also right-sized clusters for 29 pipelines, cutting their cost 17.6%.' },
        { topic: 'Shared component', text: 'Merged duplicated Dataproc pipeline templates into one framework component. 524 production schedules now run on it with no change in output.' },
        { topic: 'Source migration', text: 'Led preprod validation of 7 Hybris pipelines on the new SQL Server Hyperscale source; all 7 matched the old output.' },
        { topic: 'Team practice', text: 'Reviewed 102 pull requests across 7 repositories, triaged production incidents and wrote 7 design and analysis docs.' },
      ],
    },
    {
      title: 'Technical Trainee',
      context: 'Centre of Excellence department · Client-focused project',
      start: '2024-08',
      end: '2026-06',
      stack: ['Apache Spark', 'Dataproc', 'BigQuery', 'Datastream', 'Dataplex', 'LLMs', 'RAG'],
      points: [
        { topic: 'Cloud migration', text: 'Led the move of 13 e-commerce sources (OMS, Hybris, Shopify, Salsify, Cordial, Zendesk and more) from Databricks to Dataproc and BigQuery, checking each one against the old output.' },
        { topic: 'Order reporting', text: 'Designed change data capture for the OMS order tables with Datastream, so order reporting reads one source of truth in BigQuery (snapshot and change views), to replace Qlik.' },
        { topic: 'Data quality', text: 'Built Dataplex quality scans for 2 data products, with thresholds tested against years of production data, and a CI gate that blocks dbt models shipped without a scan.' },
        { topic: 'Client work', text: 'Turned the Looker Studio sales and demand reporting needs of the brand’s product owners and BI analysts into data models.' },
        { topic: 'Generative AI', text: 'At the Centre of Excellence, built RAG document extraction (LlamaIndex chunking into Weaviate and ChromaDB) and a Terraform linter that uses Claude on AWS Bedrock to check all 6 Well-Architected pillars.' },
      ],
    },
  ] satisfies Role[],
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function tenure(start: string, end?: string, today = new Date()) {
  const [year, month] = start.split('-').map(Number);
  const [endYear, endMonth] = end ? end.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1];
  const total = (endYear - year) * 12 + endMonth - month + 1;
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts = [years && `${years} yr${years > 1 ? 's' : ''}`, months && `${months} mo${months > 1 ? 's' : ''}`].filter(Boolean);
  const until = end ? `${monthNames[endMonth - 1]} ${endYear}` : 'Present';
  return `${monthNames[month - 1]} ${year} – ${until} · ${parts.join(' ')}`;
}

export const metrics = [
  { value: '1,455', label: 'records restored to the marketing team’s reports' },
  { value: '600+', label: 'DAGs that now fail and alert instead of hiding a timeout' },
  { value: '524', label: 'production schedules running on one shared component' },
  { value: '13', label: 'e-commerce sources moved off Databricks, each validated' },
];

export const principles = [
  {
    kind: 'Reliability',
    title: 'Failures are loud',
    text: 'A stuck job should stop and alert, not run for hours and report success. Per-task **timeouts** in the shared framework name the task that failed.',
  },
  {
    kind: 'Cost',
    title: 'Cost is a design input',
    text: 'Pruning joins and scans on a costly Spark pipeline took it from 0 of 9 runs finishing to 11 of 16, at **19.7%** lower daily cost. Clusters for 29 pipelines are sized from measured runs, not defaults.',
  },
  {
    kind: 'Data quality',
    title: 'Profile first, then enforce',
    text: '**Dataplex** thresholds come from years of production data, and CI blocks any dbt model that ships without a scan.',
  },
  {
    kind: 'Architecture',
    title: 'Move changes, not tables',
    text: 'Order data moves as changes: **CDC** with Datastream into BigQuery snapshot and change views, designed to replace third-party replication.',
  },
  {
    kind: 'AI',
    title: 'Rules decide, AI explains',
    text: 'In **imaarat.ai** a deterministic rule engine makes every decision; **LangGraph** agents read forms and explain the result, and a reviewer signs off.',
  },
  {
    kind: 'Operations',
    title: 'Fix the cause',
    text: 'Cleared platform **health-check** failures at the source: renamed data mart tables to the naming standard and added table and dependent-table descriptions for the data products.',
  },
];

export type Project = {
  name: string;
  summary: string;
  stack: string[];
  links: { label: string; href: string }[];
  note?: string;
  image?: { src: string; alt: string };
};

export const projects: Project[] = [
  {
    name: 'imaarat.ai',
    summary:
      'Underwriters get a risk decision they can check: rules score each commercial property proposal against official seismic, flood and cyclone data for 19,312 Indian PIN codes, AI reads hand-filled forms in 26 languages and explains the score, and a reviewer signs off. I built it myself: hazard joins by PIN code, a nightly ELT to Parquet, 9 dbt models with 26 tests, and LangGraph agents served over MCP and A2A.',
    stack: ['FastAPI', 'DBT', 'DuckDB', 'PostgreSQL', 'LangGraph', 'Langfuse', 'RAG', 'MCP'],
    links: [
      { label: 'Live', href: 'https://imaarat-ai.vercel.app' },
      { label: 'Code', href: 'https://github.com/adikshan11/imaarat-ai' },
      { label: 'Docs', href: 'https://adikshan11.github.io/imaarat-ai/' },
    ],
    note: 'Inspired by a Xebia capstone team project',
    image: { src: '/projects/imaarat.webp', alt: 'imaarat.ai assessment result with risk score, decision, reasons and score breakdown' },
  },
  {
    name: 'NYC Taxi Lakehouse',
    summary:
      'Medallion lakehouse on Delta Lake: bronze ingests 9.5M trips, silver quarantines 3.9% bad records through 5 reject rules, a 7-check quality gate blocks bad loads, and gold dbt marts carry 63 tests.',
    stack: ['PySpark', 'Delta Lake', 'DBT', 'DuckDB', 'Airflow'],
    links: [{ label: 'Code', href: 'https://github.com/adikshan11/lakehouse-dq-agent' }],
    image: { src: '/projects/lakehouse-lineage.svg', alt: 'Lineage from TLC parquet through bronze, silver and quarantine Delta tables, a quality gate and a DQ agent to dbt marts' },
  },
  {
    name: 'IaC Linter',
    summary:
      'Reviews Terraform against all 6 AWS Well-Architected pillars, security included, using Claude on AWS Bedrock, then applies the fixes and keeps backups.',
    stack: ['Python', 'AWS Bedrock', 'Terraform'],
    links: [{ label: 'Code', href: 'https://github.com/XI4684-AdithyaShankaran/Iac-Linter' }],
  },
  {
    name: 'Bookmark’d',
    summary:
      'Book discovery platform built by a four-member team as our final-year project; I built search, reviews and JWT login in React over PostgreSQL and Redis.',
    stack: ['React', 'PostgreSQL', 'Redis'],
    links: [
      { label: 'Live', href: 'https://bkmrkd-frontend.vercel.app' },
      { label: 'Code', href: 'https://github.com/BREACH1247/bkmrkd_frontend' },
    ],
  },
];

export const toolkit = [
  {
    label: 'Data',
    items: ['Python', 'Apache Spark', 'BigQuery', 'Google Cloud', 'Dataproc', 'Vertex AI', 'DBT', 'Airflow', 'Delta Lake', 'Databricks', 'DuckDB', 'PostgreSQL', 'MongoDB', 'Parquet', 'Looker Studio'],
  },
  {
    label: 'AI and platform',
    items: ['Gemini', 'Claude', 'LangGraph', 'Langfuse', 'MCP', 'A2A', 'RAG', 'FastAPI', 'Docker', 'Terraform', 'GitHub Actions', 'Git', 'Vercel', 'Jira', 'Confluence'],
  },
];
