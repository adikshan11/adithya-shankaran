export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Surat, Gujarat',
  email: 'adikshan11@gmail.com',
  headline: ['I make ', 'data pipelines', ' cheaper to run and ', 'numbers', ' you can trust.'],
  intro: [
    'Data engineer at **Xebia**. On client engagements I build data platforms on **Google Cloud**: **Spark** ingestion, **BigQuery**, **dbt**, and the quality checks that keep the numbers honest.',
    'Most of my best work started as a number that did not add up: batches reported **succeeded** after their time limit killed them, a Spark pipeline whose run cost I cut by **98%**, and a **32 TB** backfill that had left **1,455 records** missing.',
    'Away from pipelines I play the [piano], cheer for Real Madrid, and lose more hours to Minecraft than I should.',
  ],
  status: [
    { label: 'Live', text: 'Consolidating the Dataproc template behind 616 scheduled pipelines into one reusable component' },
    { label: 'Next', text: 'Xebia’s Forward Deployed Engineer program, from October 2026' },
  ],
  socials: [
    { label: 'Email', handle: 'adikshan11@gmail.com', href: 'mailto:adikshan11@gmail.com', icon: 'mail' },
    { label: 'LinkedIn', handle: 'adithya-shankaran', href: 'https://www.linkedin.com/in/adithya-shankaran', icon: 'linkedin' },
    { label: 'GitHub', handle: '@adikshan11', href: 'https://github.com/adikshan11', icon: 'github' },
    { label: 'X', handle: '@adithyashan11', href: 'https://x.com/adithyashan11', icon: 'x' },
  ] as const,
  coding: [
    { label: 'LeetCode', handle: '151 solved', href: 'https://leetcode.com/u/adikshan11/' },
    { label: 'CodeChef', handle: 'Rating 1614', href: 'https://www.codechef.com/users/adithyashan_11' },
  ],
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
        { topic: 'Template', text: 'leading the consolidation of the Dataproc template behind 616 scheduled pipelines into one reusable framework component.' },
        { topic: 'Silent failures', text: 'found that batches killed by their time limit were reported as succeeded; shipped per-task timeouts in the shared Vertex AI framework, with alerts that name the task.' },
        { topic: 'Pipeline cost', text: 'ended a top-cost Spark pipeline’s repeated 4-hour timeouts by pruning joins and partitions, cutting its run cost by 98%; right-sized clusters for 29 more.' },
        { topic: 'Backfill', text: 'a 32 TB dbt backfill that found and repaired 1,455 missing records across 4,200 hourly source checks.' },
        { topic: 'Health checks', text: 'cleared platform health-check violations, removing orphaned objects only after lineage, audit logs and an org-wide code search proved nobody read them.' },
      ],
    },
    {
      title: 'Technical Trainee',
      context: 'Centre of Excellence, then client engagement',
      start: '2024-08',
      end: '2026-06',
      stack: ['Apache Spark', 'Datastream', 'Airflow', 'Dataplex', 'LLMs', 'RAG'],
      points: [
        { topic: 'Migration', text: 'moved 13 e-commerce sources (OMS, Hybris, Shopify, Salsify, Cordial, Zendesk and more) from Databricks to Spark on Dataproc and BigQuery, each validated against the legacy output.' },
        { topic: 'Change data capture', text: 'designed order-data CDC with Datastream into BigQuery, with snapshot and change-processing views, to replace third-party replication.' },
        { topic: 'Event-driven ingestion', text: 'file-arrival triggers on Cloud Storage that start pipelines, and Airflow DAG orchestration from a Vertex AI trigger function.' },
        { topic: 'Data quality', text: 'Dataplex DQ scans for an order-cancellation data product and a product inventory feed, plus a CI gate that blocks any dbt model without a registered scan.' },
        { topic: 'Generative AI (CoE)', text: 'RAG document extraction on Weaviate and ChromaDB, and a Terraform linter on Claude via AWS Bedrock; selected for the Forward Deployed Engineer program.' },
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

export const principles = [
  {
    kind: 'Reliability',
    title: 'A green run is a claim, not proof',
    text: 'Dataproc batches cut off by their time limit ended **CANCELLED** while the pipeline still reported **SUCCEEDED**. Every task now has a timeout, the workload’s own terminal state decides success, and a timeout raises an alert.',
  },
  {
    kind: 'Cost',
    title: 'Cost is a design input',
    text: 'Prune partitions and joins before adding executors, and size clusters from measured runs, not defaults. That turned a pipeline with repeated 4-hour timeouts into one that costs **98% less**.',
  },
  {
    kind: 'Data quality',
    title: 'Profile first, then enforce',
    text: '**Dataplex** profiling shows what the data really looks like before any rule is written. Every check is replayed against years of production data so its threshold can actually fire, and CI blocks a dbt model that ships without one.',
  },
  {
    kind: 'Architecture',
    title: 'Move changes, not tables',
    text: 'I designed change data capture for order data with **Datastream** into BigQuery, with snapshot and change views on top, to replace third-party replication.',
  },
  {
    kind: 'Security',
    title: 'Sensitive data stays fenced',
    text: '**PII** lands in its own zone of the lake, credentials come from **Secret Manager** per environment at run time instead of living in code, data leaving the company goes out encrypted, and coding agents get **read-only** database access with a cost cap.',
  },
  {
    kind: 'Operations',
    title: 'Health checks stay green',
    text: 'When the platform health check flags an object, I fix the cause: rename tables to the naming standard, or remove an orphan only after **lineage**, **audit logs** and an org-wide code search show nobody reads it.',
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
    name: 'NYC Taxi Lakehouse',
    summary:
      'Delta Lake lakehouse that ingests 9.5M trips, quarantines 3.9% bad records through 6 business rules, blocks bad loads with a 7-check quality gate, and serves dbt marts with 63 tests.',
    stack: ['PySpark', 'Delta Lake', 'dbt', 'DuckDB', 'Airflow'],
    links: [{ label: 'Code', href: 'https://github.com/adikshan11/lakehouse-dq-agent' }],
  },
  {
    name: 'Underwriting Risk Assessment',
    summary:
      'Team-built underwriting risk app from Xebia’s X-AI Practitioner+ program, developed with GitHub Copilot custom agents, skills, rules and hooks.',
    stack: ['Python', 'LLMs', 'GitHub Copilot'],
    links: [],
    note: 'Xebia X-AI Practitioner+',
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
