export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulletPointImprovement {
  original: string;
  improved: string;
  reason?: string;
}

export interface SectionScores {
  keyword_alignment: number;
  impact_metrics: number;
  formatting_readability: number;
  role_fit: number;
}

export interface AISuggestions {
  ats_compatibility_score: number;
  executive_summary?: string;
  summary?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  optimization_tips?: string[];
  bullet_point_improvements?: (BulletPointImprovement | string)[];
  section_scores?: SectionScores;
  analysis?: AISuggestions;
}

export interface SavedResumeRecord {
  _id: string;
  userId: string;
  fileName: string;
  jobTitle: string;
  jobDescription: string;
  text: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: AISuggestions;
  createdAt: string;
}

export interface AnalysisResponse {
  success: boolean;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: AISuggestions;
  savedResume?: SavedResumeRecord;
  error?: string;
}

export interface GeneratedCodeResponse {
  success: boolean;
  filename: string;
  explanation: string;
  code: string;
  error?: string;
}

export interface JobPreset {
  id: string;
  title: string;
  description: string;
}

export const JOB_PRESETS: JobPreset[] = [
  {
    id: "fullstack-dev",
    title: "Junior Full Stack Developer",
    description:
      "Junior Full Stack Developer. We are looking for a motivated entry-level Full Stack Developer to join our engineering team. You will work on building and maintaining web applications using modern technologies. Requirements: Bachelor's degree in Computer Science or related field. Proficiency in HTML, CSS, JavaScript, and React. Experience with Node.js, Express, and REST APIs. Familiarity with MongoDB or any NoSQL database. Understanding of Git and version control. Strong problem-solving skills and attention to detail. Good communication and teamwork abilities. Nice to Have: Experience with TypeScript, Redux, or Next.js. Exposure to cloud platforms like AWS or Azure. Knowledge of CI/CD pipelines and Docker. Responsibilities: Develop and maintain responsive web applications. Build RESTful APIs and integrate with frontend components. Write clean, maintainable, and well-documented code. Collaborate with designers, product managers, and senior developers. Participate in code reviews and contribute to team best practices. Debug and resolve technical issues across the full stack.",
  },
  {
    id: "frontend-eng",
    title: "Frontend Engineer (React / TypeScript)",
    description:
      "Frontend Engineer. Seeking a developer skilled in React, TypeScript, modern CSS/Tailwind, state management, REST APIs, and responsive design. Responsibilities include building fast, accessible web applications, optimizing bundle performance, and collaborating in Git code reviews.",
  },
  {
    id: "backend-cloud",
    title: "Backend & Cloud Engineer (Node.js)",
    description:
      "Backend Engineer. Join our infrastructure team working with Node.js, Express, PostgreSQL, Redis, Docker, and AWS cloud services. Requirements include designing RESTful microservices, JWT authentication, database indexing, and automated CI/CD pipelines.",
  },
  {
    id: "data-ai",
    title: "Data & AI Systems Engineer",
    description:
      "Data & AI Systems Engineer. Requirements: Experience with Python, SQL, REST APIs, LLM architectures, vector databases, Docker, and cloud deployment. Building reliable data pipelines and integrating AI services into production applications.",
  },
];
