import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { StrategyService } from "./strategy.service.js";

@Controller("strategy")
export class StrategyController {
  constructor(private readonly strategy: StrategyService) {}

  @Get("current")
  current(@Query() query: Record<string, string | undefined>) {
    return this.strategy.current(query);
  }

  @Post("current")
  upsert(@Body() body: unknown) {
    return this.strategy.upsert(body);
  }

  @Post(":id/generate-tasks")
  generateTasks(@Param("id") id: string) {
    return this.strategy.generateTasks(id);
  }
}
