export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Surat, Gujarat',
  email: 'adikshan11@gmail.com',
  headline: ['I make ', 'data pipelines', ' cheaper to run and ', 'numbers', ' you can trust.'],
  intro:
    'Data engineer at **Xebia**, building an enterprise e-commerce data platform on **Google Cloud** with **Spark**, **BigQuery**, **dbt** and the quality checks around them.',
  status: [
    { label: 'Now', text: 'Consolidating the Dataproc template behind 616 scheduled pipelines into one reusable component' },
    { label: 'Next', text: 'Xebia’s Forward Deployed Engineer program, from October 2026' },
  ],
  socials: [
    { label: 'Email', handle: 'adikshan11@gmail.com', href: 'mailto:adikshan11@gmail.com', icon: 'mail' },
    { label: 'LinkedIn', handle: 'adithya-shankaran', href: 'https://www.linkedin.com/in/adithya-shankaran', icon: 'linkedin' },
    { label: 'GitHub', handle: '@adikshan11', href: 'https://github.com/adikshan11', icon: 'github' },
    { label: 'X', handle: '@adithyashan11', href: 'https://x.com/adithyashan11', icon: 'x' },
  ] as const,
  about: [
    'I work on the e-commerce data platform of client **Levi Strauss & Co.** I moved **13 sources** off Databricks onto **Spark on Google Cloud**, and I am now consolidating the **Dataproc template** that **616 scheduled pipelines** run on.',
    'Most of my best work started as a number that did not add up: a pipeline costing far more than it should (its run cost is now **98% lower**), batches killed by their time limit yet reported as **succeeded**, and a **32 TB** backfill that had left **1,455 records** missing.',
    'Before data engineering I built **RAG** tools at Xebia that turn messy documents, like resumes and bank statements, into clean tables.',
    'Away from pipelines I play the [piano], cheer for **Real Madrid**, and lose more hours to **Minecraft** than I should.',
  ],
};

export const metrics = [
  { value: '13', label: 'e-commerce sources I migrated to Spark on Google Cloud' },
  { value: '616', label: 'scheduled pipelines on the template I am consolidating' },
  { value: '98%', label: 'run-cost cut on a top-cost Spark pipeline I optimised' },
  { value: '1,455', label: 'missing records found and repaired in a 32 TB backfill' },
];

export type Role = {
  title: string;
  context: string;
  start: string;
  stack: string[];
  points: { topic: string; text: string }[];
};

export const experience = {
  company: 'Xebia',
  title: 'Junior Consultant, Data Engineer',
  start: '2024-08',
  location: 'Gurugram, India',
  roles: [
    {
      title: 'Data Engineering',
      context: 'Client: Levi Strauss & Co.',
      start: '2025-09',
      stack: ['GCP', 'Apache Spark', 'BigQuery', 'dbt', 'Vertex AI'],
      points: [
        { topic: 'Migration', text: 'moved 13 e-commerce sources from Databricks to Spark on Google Cloud and BigQuery, each checked against the legacy output.' },
        { topic: 'Pipeline cost', text: 'ended a top-cost Spark pipeline’s repeated 4-hour timeouts and cut its run cost by 98%; right-sized 29 more.' },
        { topic: 'Silent failures', text: 'found batches killed by their time limit were reported as succeeded; shipped task timeouts with alerts.' },
        { topic: 'Template', text: 'leading the consolidation of the Dataproc template behind 616 pipelines into one reusable component.' },
        { topic: 'Backfill', text: 'a 32 TB dbt backfill that found and repaired 1,455 missing records.' },
      ],
    },
    {
      title: 'Generative AI',
      context: 'Internal projects',
      start: '2024-08',
      stack: ['Python', 'LLMs', 'RAG'],
      points: [
        { topic: 'RAG extraction', text: 'resume parser and bank-statement PDF-to-Excel extractor on Weaviate and ChromaDB.' },
        { topic: 'IaC Linter', text: 'Terraform security and Well-Architected checks with Claude on AWS Bedrock.' },
      ],
    },
  ] satisfies Role[],
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function tenure(start: string, today = new Date()) {
  const [year, month] = start.split('-').map(Number);
  const total = (today.getFullYear() - year) * 12 + today.getMonth() + 1 - month + 1;
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts = [years && `${years} yr${years > 1 ? 's' : ''}`, months && `${months} mo${months > 1 ? 's' : ''}`].filter(Boolean);
  return `${monthNames[month - 1]} ${year} – Present · ${parts.join(' ')}`;
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
    title: 'Quality is enforced, not remembered',
    text: 'CI blocks a dbt model that ships without **Dataplex** checks, and every check is replayed against years of production data before it goes live, so its thresholds can actually fire.',
  },
  {
    kind: 'Architecture',
    title: 'Move changes, not tables',
    text: 'I designed change data capture for order data with **Datastream** into BigQuery, with snapshot and change views on top, to replace third-party replication.',
  },
  {
    kind: 'AI',
    title: 'Retrieve before you generate',
    text: 'Document extraction grounded in retrieved context from **Weaviate** and **ChromaDB**, so the model answers from the document in front of it rather than from memory.',
  },
  {
    kind: 'AI',
    title: 'Agents get guardrails',
    text: 'Coding agents reach BigQuery through a **read-only MCP server** with a per-query cost cap, and pushes or merges always stop for a human. Custom agents, skills and hooks keep them on the team’s rules.',
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

export const skills = [
  { group: 'Data engineering', items: ['Apache Spark', 'PySpark', 'SQL', 'dbt', 'Delta Lake', 'Databricks', 'CDC', 'Data modeling', 'Data quality', 'Airflow'] },
  { group: 'Google Cloud', items: ['BigQuery', 'Dataproc', 'Vertex AI Pipelines', 'Dataplex', 'Datastream', 'Dataflow', 'Pub/Sub'] },
  { group: 'AI', items: ['LLMs', 'RAG', 'Vector databases', 'Weaviate', 'ChromaDB', 'AI agents', 'MCP', 'Amazon Bedrock', 'Gemini API', 'GitHub Copilot', 'Claude Code'] },
  { group: 'Tools', items: ['Python', 'Git', 'CI/CD', 'Docker', 'Terraform', 'PostgreSQL', 'React'] },
];

export const education = [
  { school: 'Kalinga Institute of Industrial Technology', detail: 'B.Tech, Computer Science & Communication Engineering · 8.32 CGPA', period: '2020 – 2024' },
  { school: 'Delhi Public School Surat', detail: '12th Standard CBSE · 81.2%', period: '2020' },
];

export const highlights: { text: string; links?: { label: string; href: string }[] }[] = [
  { text: 'GitHub Copilot X-AI Practitioner+, Xebia (2026)' },
  {
    text: '151 problems solved on LeetCode · CodeChef highest rating 1614',
    links: [
      { label: 'LeetCode', href: 'https://leetcode.com/u/adikshan11/' },
      { label: 'CodeChef', href: 'https://www.codechef.com/users/adithyashan_11' },
    ],
  },
  { text: 'Mentor, Xebia Tech-AI-Thon · NSS Community Lead' },
];
