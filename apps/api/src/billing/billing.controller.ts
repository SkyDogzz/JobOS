import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
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

  @Post("portal")
  portal() {
    return this.billing.createPortalLink();
  }

  @Post("webhook")
  webhook(@Headers("x-jobos-webhook-signature") signature: string | undefined, @Body() body: unknown) {
    return this.billing.handleWebhook(body, signature);
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
