import { Body, Controller, Post } from "@nestjs/common";
import { AtsService } from "./ats.service.js";

@Controller("ats")
export class AtsController {
  constructor(private readonly ats: AtsService) {}

  @Post("analyses")
  analyze(@Body() body: unknown) {
    return this.ats.analyze(body);
  }
}

