import { Injectable, NotFoundException } from "@nestjs/common";
import { matchJobSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { keywordCoverage, textFromContent } from "../common/scoring.js";
import { MatchingRepository } from "./matching.repository.js";

@Injectable()
export class MatchingService {
  constructor(private readonly matches: MatchingRepository) {}

  async match(body: unknown) {
    const input = parseBody(matchJobSchema, body);
    const job = await this.matches.loadJob(input.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    const versions = await this.matches.loadResumeVersions(input.resumeVersionIds);

    const results = [];
    for (const version of versions) {
      const coverage = keywordCoverage(`${job.title} ${job.description}`, textFromContent(version.content));
      const score = Math.round(coverage.score * 0.75 + Math.min(25, coverage.covered.length));
      results.push(await this.matches.create({
        jobId: job.id,
        resumeVersionId: version.id,
        score,
        inputs: { jobTitle: job.title, resumeVersionId: version.id, resumeTitle: version.title },
        recommendations: {
          resumeName: version.resumeName,
          resumeTitle: version.title,
          strengths: coverage.covered.slice(0, 8),
          gaps: coverage.missing.slice(0, 8),
          nextSteps: coverage.missing.slice(0, 3).map((word) => `Tailor this CV with grounded ${word} evidence.`)
        }
      }));
    }
    return results.sort((a, b) => b.score - a.score);
  }

  listForJob(jobId: string) {
    return this.matches.listForJob(jobId);
  }

  listLatest() {
    return this.matches.listLatest();
  }
}
