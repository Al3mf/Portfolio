import type { IconType } from "react-icons";
import {
  SiPython,
  SiTypescript,
  SiC,
  SiPostgresql,
  SiSqlite,
  SiMongodb,
  SiGit,
  SiJira,
  SiConfluence,
  SiJenkins,
  SiDjango,
  SiAndroidstudio,
  SiPostman,
  SiSwagger,
  SiCursor,
  SiClaude,
  SiGithubcopilot,
  SiApple,
  SiNodedotjs,
  SiOpencv,
  SiIntellijidea,
  SiGoogleanalytics,
  SiGooglecolab,
  SiDiscord,
} from "react-icons/si";
import { VscAzure, VscAzureDevops } from "react-icons/vsc";
import { TbBrandCSharp, TbBrandVisualStudio } from "react-icons/tb";
import {
  LuDatabase,
  LuServer,
  LuRepeat,
  LuCompass,
  LuRoute,
  LuBot,
  LuTestTubes,
  LuCode,
  LuMessageSquare,
  LuUsers,
  LuShuffle,
  LuPuzzle,
  LuGauge,
} from "react-icons/lu";

/**
 * Maps a stack label to its icon. Brand marks where they exist, a category
 * glyph otherwise. Anything unmapped falls back to a generic code icon.
 */
const ICONS: Record<string, IconType> = {
  // Languages
  Python: SiPython,
  TypeScript: SiTypescript,
  C: SiC,
  "C#": TbBrandCSharp,
  SQL: LuDatabase,

  // QA & Testing
  Playwright: LuTestTubes,
  Postman: SiPostman,
  "Swagger UI": SiSwagger,
  "REST APIs": LuRoute,
  "REST API": LuRoute,
  Regression: LuRepeat,
  Exploratory: LuCompass,

  // Databases
  PostgreSQL: SiPostgresql,
  "Microsoft SQL Server": LuServer,
  SQLite: SiSqlite,
  MongoDB: SiMongodb,

  // Tooling & Agile
  Git: SiGit,
  Jira: SiJira,
  "Azure DevOps": VscAzureDevops,
  Azure: VscAzure,
  Confluence: SiConfluence,
  Jenkins: SiJenkins,
  Django: SiDjango,
  "Android Studio": SiAndroidstudio,
  TestFlight: SiApple,
  "IntelliJ IDEA": SiIntellijidea,
  "Google Analytics": SiGoogleanalytics,

  // AI dev tools
  Cursor: SiCursor,
  Claude: SiClaude,
  "Claude Code": SiClaude,
  "GitHub Copilot": SiGithubcopilot,
  "AI agents": LuBot,
  "Visual Studio": TbBrandVisualStudio,
  "Google Colab": SiGooglecolab,

  // Soft skills
  Communication: LuMessageSquare,
  Teamwork: LuUsers,
  Adaptability: LuShuffle,
  "Problem Solving": LuPuzzle,
  "Decision-Making Under Pressure": LuGauge,

  // Project stacks
  "Node.js": SiNodedotjs,
  "discord.js": SiDiscord,
  "Supercell API": LuRoute,
  OpenCV: SiOpencv,
};

export function techIcon(name: string): IconType {
  return ICONS[name] ?? LuCode;
}
