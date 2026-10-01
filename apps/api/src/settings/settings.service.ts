import { Injectable } from "@nestjs/common";
import { updateNotificationPreferencesSchema, updateUserSettingsSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { SettingsRepository } from "./settings.repository.js";

const updateSettingsSchema = updateUserSettingsSchema.extend({
  notificationPreferences: updateNotificationPreferencesSchema.optional()
});

@Injectable()
export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  get() {
    return this.settings.get();
  }

  update(body: unknown) {
    return this.settings.update(parseBody(updateSettingsSchema, body));
  }
}
