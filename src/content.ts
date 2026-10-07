export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Surat, Gujarat',
  email: 'adikshan11@gmail.com',
  headline: ['Building the ', 'data foundations', ' that ', 'analytics and AI', ' run on.'],
  intro: [
    'Data engineer at **Xebia**, working on client engagements with **Spark**, **BigQuery**, **dbt** and **Vertex AI**, and the quality checks that keep the numbers honest.',
    'Recently: per-task **timeouts** with alerts across a shared pipeline framework, a **98%** run-cost cut on a top-cost Spark pipeline, and **1,455 missing records** repaired in a **32 TB** backfill.',
    'Away from pipelines I play the [piano], cheer for Real Madrid, and lose more hours to Minecraft than I should.',
  ],
  status: [
    { label: 'Live', text: 'One reusable Dataproc template for 600+ scheduled pipelines' },
    { label: 'Next', text: 'Xebia’s Forward Deployed Engineer program, from October 2026' },
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
      context: 'Client engagement · Levi Strauss & Co.',
      start: '2026-07',
      stack: ['Dataproc', 'Vertex AI', 'BigQuery', 'dbt', 'Dataplex'],
      points: [
        { topic: 'Reliability', text: 'shipped per-task timeouts with named alerts in the shared Vertex AI framework, rolled out to the e-commerce pipelines.' },
        { topic: 'Platform engineering', text: 'building one reusable Dataproc template for 600+ scheduled pipelines, with a hard time limit and success read from the job’s own final state.' },
        { topic: 'Cost optimization', text: 'cut a top-cost Spark pipeline’s run cost by 98% ($51 to $0.91 per run); moved 29 pipelines to right-sized clusters.' },
        { topic: 'Source migration', text: 'validated 7 Hybris commerce pipelines against the new SQL Server Hyperscale source before cut-over.' },
        { topic: 'Data correctness', text: 'repaired 1,455 missing records in a 32 TB dbt backfill and cleared platform health-check violations.' },
      ],
    },
    {
      title: 'Technical Trainee',
      context: 'Client engagement · Levi Strauss & Co., earlier Centre of Excellence',
      start: '2024-08',
      end: '2026-06',
      stack: ['Apache Spark', 'Dataproc', 'BigQuery', 'Datastream', 'Dataplex', 'LLMs', 'RAG'],
      points: [
        { topic: 'Cloud migration', text: 'moved 13 e-commerce sources (OMS, Hybris, Shopify, Salsify, Cordial, Zendesk and more) from Databricks to Spark on Dataproc and BigQuery, each validated against the legacy output.' },
        { topic: 'Change data capture', text: 'designed order-data CDC with Datastream into BigQuery, with snapshot and change-processing views, to replace third-party replication.' },
        { topic: 'Data quality', text: 'Dataplex DQ scans for an order-cancellation data product and a product inventory feed, plus a CI gate that blocks any dbt model without a registered scan.' },
        { topic: 'Generative AI', text: 'at the Centre of Excellence, RAG document extraction on Weaviate and ChromaDB and a Terraform linter on Claude via AWS Bedrock; selected for the Forward Deployed Engineer program.' },
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
  { value: '600+', label: 'scheduled pipelines moving to one reusable template' },
  { value: '98%', label: 'run-cost cut on a top-cost Spark pipeline' },
  { value: '1,455', label: 'missing records found and repaired in a 32 TB backfill' },
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
    text: 'Pruned joins and partitions on a top-cost Spark pipeline: **98% cheaper** per run and no more 4-hour timeouts. Clusters are sized from measured runs, not defaults.',
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
    kind: 'Security',
    title: 'Sensitive data stays fenced',
    text: '**PII** in its own lake zone, credentials from **Secret Manager** at run time, encrypted outbound data, and **read-only**, cost-capped database access for coding agents.',
  },
  {
    kind: 'Operations',
    title: 'Health checks stay green',
    text: 'Cleared health-check violations at the cause: renamed tables to the standard, and removed orphans only after **lineage**, **audit logs** and code search showed no readers.',
  },
];

export type Project = {
  name: string;
  summary: string;
  stack: string[];
  links: { label: string; href: string }[];
  note?: string;
};

export const projects: Project[] = [
  {
    name: 'imaarat.ai',
    summary:
      'AI underwriting for Indian commercial property: rules score each proposal against official seismic, flood and cyclone data for 19,312 PIN codes, AI reads hand-filled forms in 26 languages, and referrals wait for reviewer sign-off. Ships with evals, tracing, MCP and A2A APIs, and CI/CD.',
    stack: ['LangGraph', 'Gemini', 'RAG', 'MCP', 'A2A', 'FastAPI', 'React', 'dbt'],
    links: [
      { label: 'Live', href: 'https://imaarat-ai.vercel.app' },
      { label: 'Code', href: 'https://github.com/adikshan11/uw-risk-assessment' },
      { label: 'Docs', href: 'https://adikshan11.github.io/uw-risk-assessment/' },
    ],
    note: 'Xebia capstone, team of three',
  },
  {
    name: 'NYC Taxi Lakehouse',
    summary:
      'Delta Lake lakehouse that ingests 9.5M trips, quarantines 3.9% bad records through 6 business rules, blocks bad loads with a 7-check quality gate, and serves dbt marts with 63 tests.',
    stack: ['PySpark', 'Delta Lake', 'dbt', 'DuckDB', 'Airflow'],
    links: [{ label: 'Code', href: 'https://github.com/adikshan11/lakehouse-dq-agent' }],
  },
  {
    name: 'IaC Linter',
    summary:
      'Checks Terraform for security issues and AWS Well-Architected gaps with Claude on AWS Bedrock, then applies fixes with backups.',
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
