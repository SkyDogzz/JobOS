import { Module } from "@nestjs/common";
import { AccountModule } from "./account/account.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { ApplicationsModule } from "./applications/applications.module.js";
import { AtsModule } from "./ats/ats.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AiModule } from "./ai/ai.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { CompaniesModule } from "./companies/companies.module.js";
import { ContactsModule } from "./contacts/contacts.module.js";
import { CopilotModule } from "./copilot/copilot.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthModule } from "./health/health.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { InterviewsModule } from "./interviews/interviews.module.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { JobSourcesModule } from "./job-sources/job-sources.module.js";
import { MatchingModule } from "./matching/matching.module.js";
import { NotesModule } from "./notes/notes.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { OperationsModule } from "./operations/operations.module.js";
import { ProfilesModule } from "./profiles/profiles.module.js";
import { ResumesModule } from "./resumes/resumes.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { SharingModule } from "./sharing/sharing.module.js";
import { StrategyModule } from "./strategy/strategy.module.js";
import { TasksModule } from "./tasks/tasks.module.js";
import { TeamsModule } from "./teams/teams.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    HealthModule,
    DatabaseModule,
    AdminModule,
    AccountModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    CompaniesModule,
    ContactsModule,
    CopilotModule,
    JobsModule,
    JobSourcesModule,
    ApplicationsModule,
    ResumesModule,
    SettingsModule,
    SharingModule,
    StrategyModule,
    DocumentsModule,
    AtsModule,
    MatchingModule,
    InterviewsModule,
    NotesModule,
    TasksModule,
    NotificationsModule,
    OperationsModule,
    IntegrationsModule,
    AnalyticsModule,
    AiModule,
    BillingModule,
    TeamsModule,
    AuditModule
  ]
})
export class AppModule {}
