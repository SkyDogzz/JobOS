import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { notificationPreferences, userSettings, users } from "@jobos/database";
import type { UpdateNotificationPreferencesInput, UpdateUserSettingsInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class SettingsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async get() {
    const userId = await this.ensureDevUser();
    const [settings, notifications] = await Promise.all([
      this.ensureSettings(userId),
      this.ensureNotificationPreferences(userId)
    ]);
    return { ...settings, notificationPreferences: notifications };
  }

  async update(input: UpdateUserSettingsInput & { notificationPreferences?: UpdateNotificationPreferencesInput }) {
    const userId = await this.ensureDevUser();
    await this.ensureSettings(userId);
    await this.ensureNotificationPreferences(userId);

    const { notificationPreferences: notificationInput, ...settingsInput } = input;
    if (Object.keys(settingsInput).length > 0) {
      await this.db
        .update(userSettings)
        .set({ ...settingsInput, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));
    }

    if (notificationInput && Object.keys(notificationInput).length > 0) {
      await this.db
        .update(notificationPreferences)
        .set({ ...notificationInput, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId));
    }

    return this.get();
  }

  private async ensureSettings(userId: string) {
    await this.db.insert(userSettings).values({ userId }).onConflictDoNothing({ target: userSettings.userId });
    const [settings] = await this.db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return settings;
  }

  private async ensureNotificationPreferences(userId: string) {
    await this.db.insert(notificationPreferences).values({ userId }).onConflictDoNothing({ target: notificationPreferences.userId });
    const [preferences] = await this.db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    return preferences;
  }

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}
