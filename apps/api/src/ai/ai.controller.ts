import { Body, Controller, Post } from "@nestjs/common";
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
}

