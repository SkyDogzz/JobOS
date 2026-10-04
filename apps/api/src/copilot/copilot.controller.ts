import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CopilotService } from "./copilot.service.js";

@Controller("copilot")
export class CopilotController {
  constructor(private readonly copilot: CopilotService) {}

  @Get()
  state() {
    return this.copilot.state();
  }

  @Post("chat")
  chat(@Body() body: unknown) {
    return this.copilot.chat(body);
  }

  @Post("actions/:id/approve")
  approve(@Param("id") id: string) {
    return this.copilot.approveAction(id);
  }

  @Post("actions/:id/reject")
  reject(@Param("id") id: string) {
    return this.copilot.rejectAction(id);
  }
}
