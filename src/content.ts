export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Gurugram, Haryana',
  email: 'adikshan11@gmail.com',
  headline: ['Building the ', 'data foundations', ' that ', 'analytics and AI', ' run on.'],
  intro: [
    'Data engineer at **Xebia**, working directly with a global apparel retail brand’s product owners and **BI analysts** on the pipelines, **CDC**, data models and **data quality** checks on Google Cloud behind their sales and demand reporting, plus **RAG** and **LangGraph** AI agents.',
    'Recently: one reusable **Dataproc** component for **524 production schedules**, per-task **timeouts** with alerts on **59 tasks**, and **1,455 missing records** repaired across **6 months** of events.',
    'Away from pipelines I play the [piano], cheer for Real Madrid, and lose more hours to Minecraft than I should.',
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
        { topic: 'Platform engineering', text: 'unified duplicated Dataproc pipeline templates into one reusable framework component powering 524 production schedules with zero output regressions, plus time limits on 600+ DAGs that expose silent 4-hour failures.' },
        { topic: 'Reliability', text: 'designed per-task time limits in the shared Vertex AI pipeline framework, sized from measured production run times, with alerts naming the failed task; enforced on 59 tasks across 25 e-commerce pipelines.' },
        { topic: 'Data correctness', text: 'restored a missing campaign attribute for the site marketing team’s twice-weekly reporting with a chained dbt backfill across 6 months of events, reconciling 4,200 hourly windows and repairing 1,455 missing records.' },
        { topic: 'Cost optimization', text: 'ended repeated 4-hour timeouts on a high-cost Hybris Spark pipeline (0 of 9 runs finished before, 11 of 16 after) and cut its daily cost 19.7%; right-sized clusters for 29 pipelines (17.6% lower cost).' },
        { topic: 'Source migration', text: 'led preprod validation of 7 Hybris pipelines on the new SQL Server Hyperscale source; all 7 matched.' },
        { topic: 'Engineering practice', text: 'triaged production incidents, reviewed 102 pull requests across 7 repositories and wrote 7 design and analysis docs.' },
      ],
    },
    {
      title: 'Technical Trainee',
      context: 'Centre of Excellence department · Client-focused project',
      start: '2024-08',
      end: '2026-06',
      stack: ['Apache Spark', 'Dataproc', 'BigQuery', 'Datastream', 'Dataplex', 'LLMs', 'RAG'],
      points: [
        { topic: 'Cloud migration', text: 'led the migration of 13 e-commerce data sources (OMS, Hybris, Shopify, Salsify, Cordial, Zendesk and more) from Databricks to Dataproc and BigQuery, each validated.' },
        { topic: 'Change data capture', text: 'designed CDC for the OMS order tables with Datastream, with BigQuery snapshot and change views as the single source of truth for order reporting, to replace Qlik.' },
        { topic: 'Data quality', text: 'built Dataplex data-quality scans for 2 data products with thresholds tested on years of production data, and a CI gate that blocks dbt models without a scan.' },
        { topic: 'Generative AI', text: 'at the Centre of Excellence, RAG extraction with LlamaIndex chunking into Weaviate and ChromaDB, and a Claude (AWS Bedrock) Terraform linter for all 6 Well-Architected pillars.' },
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
  { value: '13', label: 'e-commerce sources migrated to Spark on Google Cloud' },
  { value: '524', label: 'production schedules on one reusable Dataproc component' },
  { value: '59', label: 'pipeline tasks with per-task time limits and named alerts' },
  { value: '1,455', label: 'missing records repaired across 6 months of events' },
];

export const principles = [
  {
    kind: 'Reliability',
    title: 'Failures are loud',
    text: 'Shipped per-task **timeouts** with named alerts in the shared pipeline framework, so a stuck job stops and pages the team instead of burning hours of compute.',
  },
  {
    kind: 'Cost',
    title: 'Cost is a design input',
    text: 'Pruned joins and scans on a high-cost Spark pipeline: no more 4-hour timeouts (0 of 9 runs finished before, 11 of 16 after) and **19.7%** lower daily cost. Clusters for 29 pipelines are sized from measured runs, not defaults.',
  },
  {
    kind: 'Data quality',
    title: 'Profile first, then enforce',
    text: '**Dataplex** scans with thresholds tested on years of production data, and a CI gate that blocks any dbt model shipped without one.',
  },
  {
    kind: 'Architecture',
    title: 'Move changes, not tables',
    text: 'Order-data **CDC** with Datastream into BigQuery, with snapshot and change views, replacing third-party replication.',
  },
  {
    kind: 'AI',
    title: 'Rules decide, AI explains',
    text: 'In **imaarat.ai** a deterministic rule engine makes every decision; **LangGraph** agents read forms and explain the result, and a reviewer signs off.',
  },
  {
    kind: 'Operations',
    title: 'Health checks stay green',
    text: 'Fixed platform **health-check** failures at the cause: renamed data mart tables to the naming standard and added table and dependent-table descriptions for the data products.',
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
      'AI underwriting for Indian commercial property: rules score each proposal against official seismic, flood and cyclone data for 19,312 PIN codes, AI reads hand-filled forms in 26 languages, and referrals wait for reviewer sign-off. Ships with a nightly medallion dbt pipeline, evals, tracing, MCP and A2A APIs, and CI/CD.',
    stack: ['FastAPI', 'DBT', 'DuckDB', 'PostgreSQL', 'LangGraph', 'Langfuse', 'RAG', 'MCP'],
    links: [
      { label: 'Live', href: 'https://imaarat-ai.vercel.app' },
      { label: 'Code', href: 'https://github.com/adikshan11/imaarat-ai' },
      { label: 'Docs', href: 'https://adikshan11.github.io/imaarat-ai/' },
    ],
    note: 'Xebia capstone, team of three',
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
      'Checks Terraform against all 6 AWS Well-Architected pillars, including security, with Claude on AWS Bedrock, then applies fixes with backups.',
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
