import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list() {
    return this.notifications.list();
  }

  @Get("preferences")
  preferences() {
    return this.notifications.preferences();
  }

  @Patch("preferences")
  updatePreferences(@Body() body: unknown) {
    return this.notifications.updatePreferences(body);
  }

  @Post("regenerate")
  regenerate() {
    return this.notifications.regenerate();
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notifications.markRead(id);
  }
}
