export interface ParsedDocument {
  text: string;
  metadata: Record<string, unknown>;
}

export interface ParsedResume {
  summary: string;
  skills: string[];
  experience: Array<{ title: string; company?: string; dates?: string; highlights: string[] }>;
  education: Array<{ institution: string; credential?: string; dates?: string }>;
  links: string[];
  contact: { name?: string; email?: string; phone?: string; location?: string };
}

const sectionAliases: Record<string, keyof Pick<ParsedResume, "summary" | "skills" | "experience" | "education">> = {
  summary: "summary",
  profile: "summary",
  objective: "summary",
  skills: "skills",
  technologies: "skills",
  experience: "experience",
  employment: "experience",
  "work experience": "experience",
  education: "education"
};

export function parseResumeText(text: string): ParsedResume {
  const cleaned = text.replace(/\r/g, "").trim();
  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = collectSections(lines);
  const links = Array.from(new Set(cleaned.match(/https?:\/\/[^\s),]+/g) ?? []));
  const email = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = cleaned.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0];

  return {
    summary: firstText(sections.summary) || inferSummary(lines),
    skills: parseSkills(sections.skills ?? []),
    experience: parseExperience(sections.experience ?? []),
    education: parseEducation(sections.education ?? []),
    links,
    contact: {
      name: inferName(lines),
      email,
      phone,
      location: inferLocation(lines)
    }
  };
}

function collectSections(lines: string[]) {
  const sections: Partial<Record<keyof ParsedResume, string[]>> = {};
  let current: keyof ParsedResume | null = null;
  for (const line of lines) {
    const key = sectionAliases[line.toLowerCase().replace(/:$/, "")];
    if (key) {
      current = key;
      sections[current] ??= [];
    } else if (current) {
      sections[current]?.push(line);
    }
  }
  return sections;
}

function firstText(lines?: string[]) {
  return lines?.find((line) => !line.startsWith("-") && !line.startsWith("*")) ?? "";
}

function inferSummary(lines: string[]) {
  return lines.find((line) => line.length > 60 && !line.includes("@")) ?? "";
}

function parseSkills(lines: string[]) {
  return Array.from(new Set(lines.flatMap((line) => line.replace(/^[-*]\s*/, "").split(/[,;|]/)).map((skill) => skill.trim()).filter(Boolean)));
}

function parseExperience(lines: string[]) {
  const entries: ParsedResume["experience"] = [];
  for (const line of lines) {
    const normalized = line.replace(/^[-*]\s*/, "").trim();
    if (!normalized) continue;
    if (/[-–|@]/.test(normalized) && normalized.length < 120) {
      const [title, companyAndDates = ""] = normalized.split(/\s[-–|@]\s/, 2);
      entries.push({ title: title.trim(), company: companyAndDates.trim() || undefined, highlights: [] });
    } else if (entries.length > 0) {
      entries[entries.length - 1].highlights.push(normalized);
    }
  }
  return entries;
}

function parseEducation(lines: string[]) {
  return lines.map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean).map((line) => {
    const [credential, institution = credential] = line.split(/\s[-–|,]\s/, 2);
    return { institution: institution.trim(), credential: credential === institution ? undefined : credential.trim() };
  });
}

function inferName(lines: string[]) {
  return lines.find((line) => /^[A-Z][A-Za-z' -]{2,80}$/.test(line) && !sectionAliases[line.toLowerCase()]) ;
}

function inferLocation(lines: string[]) {
  return lines.slice(0, 6).find((line) => /,\s?[A-Z]{2}\b/.test(line));
}
