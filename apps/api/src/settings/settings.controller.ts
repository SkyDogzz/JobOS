import { Body, Controller, Get, Patch } from "@nestjs/common";
import { SettingsService } from "./settings.service.js";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  update(@Body() body: unknown) {
    return this.settings.update(body);
  }
}
