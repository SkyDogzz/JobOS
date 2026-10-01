import { Injectable, NotFoundException } from "@nestjs/common";
import { atsAnalysisSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { formattingRisk, keywordCoverage, textFromContent } from "../common/scoring.js";
import { AtsRepository } from "./ats.repository.js";

@Injectable()
export class AtsService {
  constructor(private readonly ats: AtsRepository) {}

  async analyze(body: unknown) {
    const input = parseBody(atsAnalysisSchema, body);
    const pair = await this.ats.loadPair(input.jobId, input.resumeVersionId);
    if (!pair) throw new NotFoundException("Job or resume version not found.");

    const resumeText = textFromContent(pair.resumeVersion.content);
    const coverage = keywordCoverage(`${pair.job.title} ${pair.job.description}`, resumeText);
    const format = formattingRisk(pair.resumeVersion.content);
    const roleAlignment = Math.round((coverage.score + (resumeText.includes(pair.job.title.toLowerCase()) ? 100 : 50)) / 2);
    const missingEvidence = coverage.missing.slice(0, 12);
    return this.ats.create({
      ...input,
      inputs: { jobTitle: pair.job.title, jobDescription: pair.job.description, resumeVersionId: pair.resumeVersion.id },
      scores: { keywordCoverage: coverage.score, roleAlignment, missingEvidence: Math.max(0, 100 - missingEvidence.length * 8), formattingRisk: format.score },
      findings: {
        coveredKeywords: coverage.covered.slice(0, 20),
        missingKeywords: missingEvidence,
        formattingRisks: format.risks,
        recommendations: missingEvidence.slice(0, 5).map((word) => `Add grounded evidence for ${word}.`)
      }
    });
  }
}

