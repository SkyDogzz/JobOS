import { Body, Controller, Get, Put } from "@nestjs/common";
import { ProfilesService } from "./profiles.service.js";

@Controller("profile")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  getCurrent() {
    return this.profiles.getCurrent();
  }

  @Put()
  upsert(@Body() body: unknown) {
    return this.profiles.upsert(body);
  }
}

