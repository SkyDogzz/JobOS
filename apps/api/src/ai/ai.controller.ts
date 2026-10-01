import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AiService } from "./ai.service.js";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("tailor-resume")
  tailorResume(@Body() body: unknown) {
    return this.ai.tailorResume(body);
  }

  @Post("tailor-resume/approve")
  approveTailoredResume(@Body() body: unknown) {
    return this.ai.approveTailoredResume(body);
  }

  @Post("cover-letters")
  generateCoverLetters(@Body() body: unknown) {
    return this.ai.generateCoverLetters(body);
  }

  @Post("cover-letters/approve")
  approveCoverLetter(@Body() body: unknown) {
    return this.ai.approveCoverLetter(body);
  }

  @Get("grounding-reviews")
  groundingReviews() {
    return this.ai.listGroundingReviews();
  }

  @Get("artifacts/:artifactId/grounding-reviews")
  groundingReviewsForArtifact(@Param("artifactId") artifactId: string) {
    return this.ai.listGroundingReviewsForArtifact(artifactId);
  }

  @Patch("grounding-reviews/:id")
  updateGroundingReview(@Param("id") id: string, @Body() body: unknown) {
    return this.ai.updateGroundingReview(id, body);
  }
}
