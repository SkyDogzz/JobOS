import { Injectable, NotFoundException } from "@nestjs/common";
import { updateNotificationPreferencesSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { NotificationsRepository } from "./notifications.repository.js";

@Injectable()
export class NotificationsService {
  constructor(private readonly notifications: NotificationsRepository) {}

  list() {
    return this.notifications.list();
  }

  preferences() {
    return this.notifications.preferences();
  }

  updatePreferences(body: unknown) {
    return this.notifications.updatePreferences(parseBody(updateNotificationPreferencesSchema, body));
  }

  regenerate() {
    return this.notifications.generateReminders();
  }

  async markRead(id: string) {
    const notification = await this.notifications.markRead(id);
    if (!notification) throw new NotFoundException("Notification not found.");
    return notification;
  }
}
