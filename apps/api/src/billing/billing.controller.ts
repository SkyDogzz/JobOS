import { Body, Controller, Get, Post } from "@nestjs/common";
import { BillingService } from "./billing.service.js";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("status")
  status() {
    return this.billing.getBillingStatus();
  }

  @Post("checkout")
  checkout(@Body() body: unknown) {
    return this.billing.startCheckout(body);
  }

  @Get("usage-events")
  usageEvents() {
    return this.billing.listUsageEvents();
  }

  @Post("usage/override")
  overrideUsage(@Body() body: unknown) {
    return this.billing.overrideUsage(body);
  }
}
