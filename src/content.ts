export const profile = {
  name: 'Adithya Shankaran',
  role: 'Data Engineer',
  company: 'Xebia',
  location: 'Surat, Gujarat',
  email: 'adikshan11@gmail.com',
  intro:
    'I build and run data platforms on Google Cloud: Spark ingestion, BigQuery, dbt and the quality gates around them. I also bring Generative AI into data work, as tools I direct and review.',
  links: [
    { label: 'GitHub', href: 'https://github.com/adikshan11' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/adithya-shankaran' },
  ],
  codingProfiles: [
    { label: 'LeetCode', href: 'https://leetcode.com/u/adikshan11/' },
    { label: 'CodeChef', href: 'https://www.codechef.com/users/adithyashan_11' },
  ],
  about: [
    'I started in machine learning and Generative AI at Xebia, building RAG tools that pull clean data out of messy documents. Since 2025 I work on the e-commerce data platform of Levi Strauss & Co.: migrating ingestion to Spark on Google Cloud, cutting pipeline cost, and making data quality something CI enforces instead of something people remember.',
    'I use AI coding assistants daily, as tools I direct and review, not a replacement for knowing the system. Outside work I play keys; I won KIIT’s K-STAR instrumental music competition.',
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
  period: string;
  stack: string[];
  points: string[];
};

export const experience = {
  company: 'Xebia',
  title: 'Junior Consultant, Data Engineer',
  period: 'Aug 2024 – Present',
  location: 'Gurugram, India',
  roles: [
    {
      title: 'Levi Strauss & Co.',
      context: 'Client · e-commerce data platform',
      period: 'Sep 2025 – Present',
      stack: ['GCP', 'Apache Spark', 'BigQuery', 'dbt', 'Vertex AI'],
      points: [
        'Led the migration of 13 e-commerce data sources from Databricks to Spark on Google Cloud (Dataproc) and BigQuery, validating each pipeline against legacy output.',
        'Leading the consolidation of the Dataproc template behind 616 scheduled pipelines into one reusable framework component; found that batches killed by their time limit were reported as succeeded, and shipped task timeouts with alerts.',
        'Cut a top-cost Spark pipeline’s run cost by 98% and ended its repeated 4-hour timeouts by pruning joins and partitions; right-sized clusters for 29 pipelines.',
        'Owned data correctness for marketing analytics: a 32 TB dbt backfill that found and repaired 1,455 missing records across 4,200 hourly source checks, plus a CI gate blocking dbt models without Dataplex checks.',
        'Designed change data capture for order data with Datastream and BigQuery snapshot and change views, to replace Qlik replication.',
      ],
    },
    {
      title: 'Generative AI and AI-native engineering',
      context: 'Internal',
      period: 'Aug 2024 – Present',
      stack: ['Python', 'LLMs', 'RAG', 'GitHub Copilot'],
      points: [
        'Built RAG document extraction with LLMs and Weaviate/ChromaDB: a resume parser and a bank-statement PDF-to-Excel extractor for complex tables, queried through a Streamlit chatbot.',
        'Built a Terraform linter on Claude (AWS Bedrock) for security and Well-Architected checks; selected for Xebia’s Forward Deployed Engineer program.',
      ],
    },
  ] satisfies Role[],
};

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

export const highlights = [
  'GitHub Copilot X-AI Practitioner+, Xebia (2026)',
  '151 problems solved on LeetCode · CodeChef highest rating 1614',
  'Mentor, Xebia Tech-AI-Thon · NSS Community Lead',
  'Winner, K-STAR instrumental music competition, KIIT',
];
