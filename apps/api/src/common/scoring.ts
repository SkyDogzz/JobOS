export function textFromContent(content: Record<string, unknown>) {
  return JSON.stringify(content).toLowerCase();
}

export function keywords(text: string) {
  const stop = new Set(["and", "the", "for", "with", "from", "that", "this", "you", "our", "are", "will", "job", "role", "work"]);
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [])).filter((word) => !stop.has(word)).slice(0, 80);
}

export function keywordCoverage(jobText: string, resumeText: string) {
  const jobKeywords = keywords(jobText);
  const resumeWords = new Set(keywords(resumeText));
  const covered = jobKeywords.filter((word) => resumeWords.has(word));
  const missing = jobKeywords.filter((word) => !resumeWords.has(word));
  return { jobKeywords, covered, missing, score: jobKeywords.length ? Math.round((covered.length / jobKeywords.length) * 100) : 0 };
}

export function formattingRisk(content: Record<string, unknown>) {
  const text = textFromContent(content);
  const risks = [
    !content.summary ? "Missing summary section" : "",
    !Array.isArray(content.skills) || content.skills.length === 0 ? "Missing skills list" : "",
    text.includes("table") ? "Possible table-heavy formatting" : "",
    text.length < 500 ? "Resume content is short for ATS parsing" : ""
  ].filter(Boolean);
  return { score: Math.max(0, 100 - risks.length * 20), risks };
}

