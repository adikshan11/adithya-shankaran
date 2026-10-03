export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Surat, Gujarat',
  email: 'adikshan11@gmail.com',
  headline: ['I make ', 'data pipelines', ' cheaper to run and ', 'numbers', ' you can trust.'],
  intro:
    'Data engineer at Xebia, working on the e-commerce data platform of Levi Strauss & Co. on Google Cloud: Spark, BigQuery, dbt and the quality checks around them.',
  focus: ['Spark migrations', 'Pipeline cost', 'Data quality'],
  now: 'Consolidating the Dataproc template behind 616 scheduled pipelines into one reusable framework component. Selected for Xebia’s Forward Deployed Engineer program, starting October 2026.',
  socials: [
    { label: 'Email', handle: 'adikshan11@gmail.com', href: 'mailto:adikshan11@gmail.com', icon: 'mail' },
    { label: 'LinkedIn', handle: 'adithya-shankaran', href: 'https://www.linkedin.com/in/adithya-shankaran', icon: 'linkedin' },
    { label: 'GitHub', handle: '@adikshan11', href: 'https://github.com/adikshan11', icon: 'github' },
    { label: 'X', handle: '@adithyashan11', href: 'https://x.com/adithyashan11', icon: 'x' },
  ] as const,
  about: [
    'I joined Xebia in 2024 after my B.Tech at KIIT and started on the Generative AI side, building retrieval tools that pull structured data out of messy documents. A year later I moved to data engineering for Levi Strauss & Co., moving their e-commerce data onto Google Cloud.',
    'The work I enjoy most is the investigation: a job that reports success but did nothing, a backfill missing one hour a day, a pipeline that costs fifty times what it should. Most of my best work started as a number that did not add up.',
    'Outside work I play the piano; I hold Grade 8 in Electronic Keyboard from Trinity College London.',
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
      title: 'Levi Strauss & Co.',
      context: 'Client · e-commerce data platform',
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
      context: 'Internal',
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
  { group: 'AI', items: ['LLMs', 'RAG', 'Weaviate', 'ChromaDB', 'GitHub Copilot', 'Claude Code', 'MCP'] },
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
