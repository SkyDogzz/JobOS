export interface JobSourceAdapter {
  name: string;
  import(url: string): Promise<unknown>;
}

export interface ParsedJobPosting {
  title: string;
  companyName?: string;
  location?: string;
  description: string;
  sourceUrl?: string;
  sourceName: string;
  remotePolicy?: string;
  salaryText?: string;
  parser: string;
}

export interface ParseJobPostingInput {
  url?: string;
  html?: string;
  text?: string;
}

const parserNames = ["greenhouse", "lever", "ashby", "workday", "linkedin", "indeed", "generic"] as const;

export function parseJobPosting(input: ParseJobPostingInput): ParsedJobPosting {
  const raw = input.html || input.text || "";
  const text = decodeEntities(stripTags(raw)).replace(/\s+/g, " ").trim();
  const url = input.url;
  const parser = detectParser(url, raw, text);
  const title = pickMeta(raw, ["og:title", "twitter:title"]) || pickJsonLd(raw, "title") || pickLabeled(text, ["Job Title", "Title"]) || inferTitle(text);
  const companyName = pickMeta(raw, ["og:site_name"]) || pickJsonLd(raw, "hiringOrganization.name") || pickLabeled(text, ["Company", "Hiring Organization"]);
  const location = pickJsonLd(raw, "jobLocation.address.addressLocality") || pickLabeled(text, ["Location", "Job Location"]) || inferLocation(text);
  const description = pickJsonLd(raw, "description") || pickLabeledBlock(text, ["Description", "About the role", "The Role", "Job Description"]) || text.slice(0, 4000);
  const salaryText = pickLabeled(text, ["Salary", "Compensation", "Pay"]) || (text.match(/(?:\$|USD|EUR|GBP|€)\s?[\d,.]+(?:\s?[-–]\s?(?:\$|USD|EUR|GBP|€)?\s?[\d,.]+)?(?:k|K)?/)?.[0]);
  const remotePolicy = /\b(remote|hybrid|onsite|on-site)\b/i.exec(text)?.[0];

  return {
    title: clean(title || "Untitled role") ?? "Untitled role",
    companyName: clean(companyName),
    location: clean(location),
    description: clean(description || text) ?? "No description parsed.",
    sourceUrl: url,
    sourceName: sourceName(parser, url),
    remotePolicy: clean(remotePolicy),
    salaryText: clean(salaryText),
    parser
  };
}

function detectParser(url = "", raw = "", text = ""): typeof parserNames[number] {
  const haystack = `${url} ${raw.slice(0, 1000)} ${text.slice(0, 1000)}`.toLowerCase();
  for (const name of parserNames) {
    if (name !== "generic" && haystack.includes(name)) return name;
  }
  if (haystack.includes("myworkdayjobs")) return "workday";
  return "generic";
}

function sourceName(parser: string, url = "") {
  if (parser !== "generic") return parser;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "manual";
  }
}

function stripTags(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function decodeEntities(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, "\"");
}

function pickMeta(html: string, names: string[]) {
  for (const name of names) {
    const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, "i");
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function pickJsonLd(html: string, path: string) {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const json = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    try {
      const parsed = JSON.parse(json);
      const value = path.split(".").reduce<unknown>((current, key) => {
        if (Array.isArray(current)) return current[0]?.[key];
        if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
        return undefined;
      }, parsed);
      if (typeof value === "string") return value;
    } catch {
      continue;
    }
  }
  return undefined;
}

function pickLabeled(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}\\s*:?\\s*([^|\\n]{2,120})`, "i"));
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function pickLabeledBlock(text: string, labels: string[]) {
  for (const label of labels) {
    const index = text.toLowerCase().indexOf(label.toLowerCase());
    if (index >= 0) return text.slice(index + label.length, index + label.length + 4000);
  }
  return undefined;
}

function inferTitle(text: string) {
  return text.split(/[.!?]/)[0]?.slice(0, 120);
}

function inferLocation(text: string) {
  return text.match(/\b[A-Z][A-Za-z .'-]+,\s?[A-Z]{2}\b/)?.[0];
}

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").replace(/^[:|-]\s*/, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
