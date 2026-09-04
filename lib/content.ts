// -----------------------------------------------------------------------------
// Portfolio content. Edit this file to update the site — nothing else required.
// -----------------------------------------------------------------------------

export const profile = {
  name: "Alejandro Melo Flores",
  role: "QA Engineer",
  tagline: "QA Engineer · CS & Systems Engineering Student",
  location: "San Luis Potosí, Mexico",
  email: "alejandro.meloflores@gmail.com",
  github: "https://github.com/Al3mf",
  linkedin: "https://www.linkedin.com/in/alejandro-melo-flores/",
  // Drop a photo at /public/avatar.jpg to show it in the hero. Leave as null for none.
  avatar: null as string | null,
  bio: "Systems Engineering and Applied Computer Science student with 3+ years of professional experience as a Quality Assurance Engineer for international web and mobile teams. I care about problem-solving, continuous learning, and shipping software people can trust — hands-on with Python, TypeScript, and C across logistics, video games, research, and infrastructure.",
};

// Grouped the way the CV lists skills: a category, then optional proficiency
// bands (Intermediate / Basic). Omit `level` for a flat list.
export type StackBand = { level?: string; items: string[] };
export type StackGroup = { label: string; bands: StackBand[] };

export const stack: StackGroup[] = [
  {
    label: "Programming Languages",
    bands: [
      { level: "Intermediate", items: ["Python", "TypeScript", "C", "SQL"] },
      { level: "Basic", items: ["C#"] },
    ],
  },
  {
    label: "Frameworks & Tools",
    bands: [{ level: "Intermediate", items: ["Playwright", "Postman"] }],
  },
  {
    label: "Tools",
    bands: [
      {
        items: [
          "Git",
          "Postman",
          "Visual Studio",
          "AI agents",
          "Cursor",
          "Claude",
          "GitHub Copilot",
          "Google Colab",
        ],
      },
    ],
  },
  {
    label: "Databases",
    bands: [
      { level: "Intermediate", items: ["Microsoft SQL Server", "PostgreSQL"] },
      { level: "Basic", items: ["MongoDB"] },
    ],
  },
  {
    label: "Agile",
    bands: [{ items: ["Jira", "Azure", "Confluence"] }],
  },
  {
    label: "Soft Skills",
    bands: [
      {
        items: [
          "Communication",
          "Teamwork",
          "Adaptability",
          "Problem Solving",
          "Decision-Making Under Pressure",
        ],
      },
    ],
  },
];

export type Job = {
  company: string;
  title: string;
  period: string;
  location: string;
  type?: string;
  highlights: string[];
  stack: string[];
};

export const experience: Job[] = [
  {
    company: "Shipwell",
    title: "Senior Quality Assurance Engineer",
    period: "Jan 2024 – Jul 2026",
    location: "Remote / Mexico",
    highlights: [
      "Ran ~150 test cases per sprint across shipment, tracking, scheduling and transportation workflows, lifting overall test coverage by 75%.",
      "Validated REST APIs, webhooks, frontend behavior and backend integrations with Postman, cutting API-related production defects by 30%.",
      "Partnered with engineering and product to reproduce defects, validate fixes and assess release readiness, reducing release-blocking defects by 25%.",
      "Refined requirements and user stories in grooming sessions, cutting requirement-related rework by 50%.",
      "Reduced production bugs by 20% in the latest sprint through stronger regression and exploratory coverage.",
      "Designed and rolled out a QA onboarding flow that cut new-hire ramp-up time by 30%.",
    ],
    stack: ["TypeScript", "Jira", "Postman", "Django", "Playwright", "Android Studio", "TestFlight", "Confluence", "REST API", "Swagger UI"],
  },
  {
    company: "Blizzard Entertainment",
    title: "Quality Assurance Engineer",
    type: "Internship",
    period: "Aug 2024 – Jan 2025",
    location: "",
    highlights: [
      "Performed functional, exploratory and regression testing, surfacing ~25 defects per cycle before release.",
      "Documented defects with clear reproduction steps, expected vs. actual results and supporting evidence, reducing the defect reopen rate by 20%.",
    ],
    stack: ["TypeScript", "Jenkins", "IntelliJ IDEA"],
  },
  {
    company: "Total Quality Logistics",
    title: "Quality Assurance Engineer",
    period: "Jan 2022 – Dec 2023",
    location: "",
    highlights: [
      "Executed 110 test cases per release cycle for logistics and transportation workflows, covering 75% of critical business flows.",
      "Designed test scenarios and validated fixes against business requirements and acceptance criteria, reducing defect leakage to production by 40%.",
      "Drove grooming sessions with product and engineering, cutting requirement-related defects by 30%.",
      "Increased manual test case coverage by 60% across core workflows.",
      "Automated 45 test cases, improving reliability by 35% and cutting manual regression effort by 50%.",
    ],
    stack: ["Azure", "Playwright", "SQL", "Google Analytics", "TestFlight"],
  },
];

export type Project = {
  name: string;
  blurb: string;
  stack: string[];
  href?: string;
};

export const projects: Project[] = [
  {
    name: "Complexity Discord Bot",
    blurb:
      "Self-hosted Discord bot that automates registration and tournament management for a 2,000+ player Brawl Stars community. Slash commands, rank/region classification, visual match-statistics generation, file-based participant comparison and per-user rate limiting on a local SQLite database — cutting manual tournament setup time by 50%.",
    stack: ["Node.js", "discord.js", "Supercell API", "SQLite"],
    href: "https://github.com/Al3mf/complexity-discord-bot",
  },
  {
    name: "AI Facial Recognition Access Control",
    blurb:
      "Four-person prototype for local facial-recognition access control using Haar Cascade detection and LBPH recognition, reaching 85%+ authorization accuracy. Built the full capture–train–recognize pipeline (50+ images per profile) with real-time pass/fail feedback, cutting manual access verification time by 70%.",
    stack: ["Python", "OpenCV"],
    href: "https://github.com/Al3mf/ai-face-id",
  },
];

export type School = {
  school: string;
  short: string; // monogram shown as the school's mark
  program: string;
  location: string;
  period: string;
};

export const education: School[] = [
  {
    school: "City University of Seattle",
    short: "CityU",
    program: "B.S. in Applied Computer Science",
    location: "Seattle, WA",
    period: "Expected Jul 2028",
  },
  {
    school: "Universidad Autónoma de San Luis Potosí",
    short: "UASLP",
    program: "Bachelor's in Systems Engineering",
    location: "San Luis Potosí, Mexico",
    period: "Expected Jul 2028",
  },
];

export type Activity = { title: string; org: string; period: string; detail: string };

export const activities: Activity[] = [
  {
    title: "Social Media Ambassador",
    org: "CityU International — City University of Seattle",
    period: "Summer 2026",
    detail:
      "Created content for CityU International's official Instagram: student interviews, travel photography and short-form coverage of the Seattle summer program and the international student experience.",
  },
  {
    title: "Semi-Professional Player & In-Game Leader",
    org: "Competitive Gaming",
    period: "",
    detail:
      "Built communication, teamwork, adaptability and rapid decision-making under pressure while calling strategy across multiple competitive titles.",
  },
];

export const languages = [
  { name: "Spanish", level: "Native" },
  { name: "English", level: "Advanced" },
  { name: "Korean", level: "Basic" },
];
