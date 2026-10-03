const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface DashboardJob {
  id: string;
  title: string;
  description: string;
  companyName: string | null;
  location: string | null;
  sourceUrl: string | null;
  sourceId?: string | null;
  sourceName: string | null;
  sourceKind?: string | null;
  sourceStatus?: string | null;
}

export interface DashboardApplication {
  id: string;
  stage: string;
  jobId?: string;
  jobTitle: string;
  companyName: string | null;
}

export interface ApplicationDetail extends DashboardApplication {
  appliedAt: string | null;
  outcome: string | null;
  jobId: string;
  jobDescription: string;
  jobLocation: string | null;
  resumeVersionId: string | null;
  createdAt: string;
  events: Array<{
    id: string;
    kind: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  analyses: AnalysisSummary[];
  contacts: ContactSummary[];
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  body: string;
  createdAt: string;
}

export interface ApplicationTask {
  id: string;
  applicationId: string | null;
  title: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
}

export interface ApplicationInterview {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string | null;
  format: string | null;
  location: string | null;
  participants: string[];
  preparationNotes: string | null;
  outcome: string | null;
  notes: string | null;
  calendarStatus?: string | null;
  calendarConflictStatus?: string | null;
  calendarEventId?: string | null;
  jobTitle: string;
  companyName: string | null;
  stage: string;
  createdAt: string;
}

export interface CandidateProfile {
  id: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  canonicalData: {
    skills?: string[];
    experience?: string;
  };
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface DashboardResume {
  id: string;
  name: string;
  versionId: string | null;
  versionTitle: string | null;
}

export interface ResumeDetail {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    resumeId: string;
    versionNumber: number;
    title: string;
    content: Record<string, unknown>;
    createdAt: string;
  }>;
  applications: Array<{
    id: string;
    stage: string;
    resumeVersionId: string | null;
    jobTitle: string;
    companyName: string | null;
    createdAt: string;
  }>;
  analyses: AnalysisSummary[];
  matches: MatchSummary[];
}

export interface AnalysisSummary {
  id: string;
  jobId?: string;
  resumeVersionId?: string;
  scores: Record<string, unknown>;
  findings: Record<string, unknown>;
  createdAt: string;
}

export interface MatchSummary {
  id: string;
  jobId?: string;
  resumeVersionId: string;
  score: number;
  recommendations: Record<string, unknown>;
  resumeName?: string;
  resumeTitle?: string;
  createdAt: string;
}

export interface AuditEventSummary {
  id: string;
  eventType: string;
  relatedEntity: string;
  relatedEntityId: string;
  applicationId: string | null;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface JobDetail extends DashboardJob {
  matches: MatchSummary[];
  contacts: ContactSummary[];
}

export interface DocumentSummary {
  id: string;
  applicationId: string | null;
  kind: string;
  name: string;
  contentHash: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentExport {
  filename: string;
  format: "markdown" | "pdf" | "docx";
  mimeType: string;
  content: string;
  metadataSidecar: Record<string, unknown>;
}

export interface AiArtifactSummary {
  id: string;
  applicationId: string | null;
  provider: string;
  model: string;
  purpose: string;
  promptHash: string;
  output: Record<string, unknown>;
  groundedInProfile: boolean;
  createdAt: string;
}

export interface GroundingReviewSummary {
  id: string;
  artifactId: string;
  claim: string;
  evidence: Record<string, unknown>;
  status: string;
  reviewerNote: string | null;
  purpose?: string;
  provider?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
}

export interface CompanyDetail extends CompanySummary {
  contacts: ContactSummary[];
  jobs: Array<{
    id: string;
    title: string;
    location: string | null;
    sourceUrl: string | null;
    createdAt: string;
  }>;
}

export interface ContactSummary {
  id: string;
  companyId: string | null;
  companyName?: string | null;
  name: string;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  followUpAt?: string | null;
  relationship?: string;
  linkNotes?: string | null;
}

export interface JobSourceSummary {
  id: string;
  name: string;
  kind: string;
  baseUrl: string | null;
  status: string;
  notes: string | null;
}

export interface DiscoveredJobSummary {
  id: string;
  title: string;
  companyName: string | null;
  description: string;
  location: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  status: string;
  reliabilityScore: number;
  duplicateScore: number;
  relevanceScore: number;
  snoozedUntil: string | null;
}

export interface EmailConnectionSummary {
  id: string;
  provider: string;
  accountEmail: string;
  status: string;
  excludeBodies: boolean;
  syncState: Record<string, unknown>;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface EmailSyncJobSummary {
  id: string;
  connectionId: string;
  status: string;
  cursor: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  provider: string;
  accountEmail: string;
  createdAt: string;
}

export interface EmailMessageSummary {
  id: string;
  connectionId: string;
  applicationId: string | null;
  providerMessageId: string;
  fromAddress: string | null;
  subject: string | null;
  snippet: string | null;
  body: string | null;
  classification: string;
  classificationReason: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface CalendarConnectionSummary {
  id: string;
  provider: string;
  accountEmail: string;
  calendarName: string | null;
  status: string;
  syncState: Record<string, unknown>;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface CalendarSyncJobSummary {
  id: string;
  connectionId: string;
  status: string;
  cursor: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  provider: string;
  accountEmail: string;
  createdAt: string;
}

export interface CalendarEventSummary {
  id: string;
  connectionId: string;
  interviewId: string | null;
  taskId: string | null;
  providerEventId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  status: string;
  conflictStatus: string;
  createdAt: string;
}

export interface NotificationSummary {
  id: string;
  applicationId: string | null;
  taskId: string | null;
  kind: string;
  title: string;
  body: string;
  status: string;
  deliveryChannel: string;
  scheduledFor: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  dueSoonDays: number;
  taskRemindersEnabled: boolean;
  followUpSuggestionsEnabled: boolean;
  deliveryChannel: string;
}

export interface UserSettings {
  id: string;
  timezone: string;
  preferredLocations: string[];
  remotePreference: string;
  minimumSalary: string | null;
  preferredSources: string[];
  defaultAiProvider: string;
  defaultAiModel: string;
  redactSensitiveExports: boolean;
  storeEmailBodies: boolean;
  aiArtifactRetention: string;
  notificationPreferences: NotificationPreferences;
}

export interface AccountExportSummary {
  exportedAt: string;
  formatVersion: string;
  user: SessionUser;
  jobs: DashboardJob[];
  applications: DashboardApplication[];
  resumes: DashboardResume[];
  documents: DocumentSummary[];
  tasks: ApplicationTask[];
  aiArtifacts: AiArtifactSummary[];
}

export interface HealthMetrics {
  service: string;
  version: string;
  uptimeSeconds: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  monitoring: { rateLimitWindowMs: number; rateLimitMax: number };
}

export interface FunnelAnalytics {
  totalApplications: number;
  activeApplications: number;
  terminalApplications: number;
  stageCounts: Array<{ stage: string; count: number; averageAgeDays: number }>;
  aging: {
    averageActiveAgeDays: number;
    oldestActiveAgeDays: number;
  };
}

export interface SourcePerformanceAnalytics {
  totalSources: number;
  sources: Array<{
    sourceId: string | null;
    sourceName: string;
    sourceStatus: string | null;
    sourceNotes: string | null;
    applicationCount: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    rejectionRate: number;
    rankScore: number;
    qualityNote: string;
  }>;
}

export interface OperationsAnalytics {
  interviews: {
    totalInterviews: number;
    completedInterviews: number;
    applicationsWithInterviews: number;
    interviewConversionRate: number;
    offerConversionRate: number;
    outcomeCaptureRate: number;
    outcomes: Array<{ outcome: string; count: number }>;
  };
  tasks: {
    totalTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
    completedTasks: number;
    openTasks: number;
    dueSoonTasks: number;
    completionRate: number;
    onTimeCompletionRate: number;
    dueDateCoverageRate: number;
  };
}

export interface DocumentPerformanceAnalytics {
  resumeVersions: Array<{
    resumeVersionId: string;
    resumeTitle: string;
    versionNumber: number;
    applicationCount: number;
    activeCount: number;
    successfulCount: number;
    stageCounts: Record<string, number>;
  }>;
  documents: Array<{
    kind: string;
    documentCount: number;
    linkedApplicationCount: number;
    successfulApplicationCount: number;
    successRate: number;
  }>;
  artifacts: Array<{
    purpose: string;
    provider: string;
    model: string;
    count: number;
  }>;
}

export interface SearchStrategyPlan {
  id: string;
  weekStartsAt: string;
  goals: Record<string, number>;
  recommendations: Array<{ kind?: string; title?: string; reason?: string }>;
  progress: Record<string, unknown> & {
    missedCommitments?: string[];
    staleApplicationCount?: number;
  };
  generatedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedJobFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
}

export interface ParsedJobPosting {
  title: string;
  companyName?: string;
  location?: string;
  description: string;
  sourceUrl?: string;
  sourceName: string;
  remotePolicy?: string;
  salaryText?: string;
  parser: string;
}

export interface DuplicateJobCandidate extends DashboardJob {
  duplicateScore: number;
  duplicateReasons: string[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardData() {
  try {
    const [jobs, applications, resumes, matches, activity, strategy] = await Promise.all([
      getJson<DashboardJob[]>("/jobs"),
      getJson<DashboardApplication[]>("/applications"),
      getJson<DashboardResume[]>("/resumes"),
      getJson<MatchSummary[]>("/matches"),
      getJson<AuditEventSummary[]>("/audit/events"),
      getJson<SearchStrategyPlan>("/strategy/current")
    ]);

    return { jobs, applications, resumes, matches, activity, strategy, apiAvailable: true };
  } catch {
    return {
      jobs: [] as DashboardJob[],
      applications: [] as DashboardApplication[],
      resumes: [] as DashboardResume[],
      matches: [] as MatchSummary[],
      activity: [] as AuditEventSummary[],
      strategy: null as SearchStrategyPlan | null,
      apiAvailable: false
    };
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getJobs(query = "") {
  return getJson<DashboardJob[]>(`/jobs${query}`);
}

export async function getJobDetail(id: string) {
  return getJson<JobDetail>(`/jobs/${id}`);
}

export async function getResumes() {
  return getJson<DashboardResume[]>("/resumes");
}

export async function getResumeDetail(id: string) {
  return getJson<ResumeDetail>(`/resumes/${id}`);
}

export async function getApplicationDetail(id: string) {
  return getJson<ApplicationDetail>(`/applications/${id}`);
}

export async function getApplicationNotes(id: string) {
  return getJson<ApplicationNote[]>(`/applications/${id}/notes`);
}

export async function getApplicationTasks(id: string) {
  return getJson<ApplicationTask[]>(`/applications/${id}/tasks`);
}

export async function getApplicationInterviews(id: string) {
  return getJson<ApplicationInterview[]>(`/applications/${id}/interviews`);
}

export async function getAuditEvents(query = "") {
  return getJson<AuditEventSummary[]>(`/audit/events${query}`);
}

export async function getInterviews() {
  return getJson<ApplicationInterview[]>("/interviews");
}

export async function getApplications() {
  return getJson<DashboardApplication[]>("/applications");
}

export async function getCandidateProfile() {
  return getJson<CandidateProfile | null>("/profile");
}

export async function getDocuments() {
  return getJson<DocumentSummary[]>("/documents");
}

export async function getDocumentDetail(id: string) {
  return getJson<DocumentSummary>(`/documents/${id}`);
}

export async function getDocumentExport(id: string, format: "markdown" | "pdf" | "docx" = "markdown") {
  return getJson<DocumentExport>(`/documents/${id}/export?format=${format}`);
}

export async function getAiArtifacts() {
  return getJson<AiArtifactSummary[]>("/documents/artifacts");
}

export async function getGroundingReviews() {
  return getJson<GroundingReviewSummary[]>("/ai/grounding-reviews");
}

export async function getCompanies() {
  return getJson<CompanySummary[]>("/companies");
}

export async function getCompanyDetail(id: string) {
  return getJson<CompanyDetail>(`/companies/${id}`);
}

export async function getContacts() {
  return getJson<ContactSummary[]>("/contacts");
}

export async function getJobSources() {
  return getJson<JobSourceSummary[]>("/job-sources");
}

export async function getDiscoveredJobs() {
  return getJson<DiscoveredJobSummary[]>("/job-sources/discovered");
}

export async function getSavedJobFilters() {
  return getJson<SavedJobFilter[]>("/jobs/filters");
}

export async function getSession() {
  return getJson<SessionUser | null>("/auth/session");
}

export async function getEmailConnections() {
  return getJson<EmailConnectionSummary[]>("/integrations/email/connections");
}

export async function getEmailSyncJobs() {
  return getJson<EmailSyncJobSummary[]>("/integrations/email/sync-jobs");
}

export async function getEmailMessages() {
  return getJson<EmailMessageSummary[]>("/integrations/email/messages");
}

export async function getCalendarConnections() {
  return getJson<CalendarConnectionSummary[]>("/integrations/calendar/connections");
}

export async function getCalendarSyncJobs() {
  return getJson<CalendarSyncJobSummary[]>("/integrations/calendar/sync-jobs");
}

export async function getCalendarEvents() {
  return getJson<CalendarEventSummary[]>("/integrations/calendar/events");
}

export async function getNotifications() {
  return getJson<NotificationSummary[]>("/notifications");
}

export async function getNotificationPreferences() {
  return getJson<NotificationPreferences>("/notifications/preferences");
}

export async function getUserSettings() {
  return getJson<UserSettings>("/settings");
}

export async function getAccountExportSummary() {
  return getJson<AccountExportSummary>("/account/export");
}

export async function getHealthMetrics() {
  return getJson<HealthMetrics>("/health/metrics");
}

export async function getFunnelAnalytics(query = "") {
  return getJson<FunnelAnalytics>(`/analytics/funnel${query}`);
}

export async function getSourcePerformanceAnalytics(query = "") {
  return getJson<SourcePerformanceAnalytics>(`/analytics/sources${query}`);
}

export async function getOperationsAnalytics(query = "") {
  return getJson<OperationsAnalytics>(`/analytics/operations${query}`);
}

export async function getDocumentPerformanceAnalytics(query = "") {
  return getJson<DocumentPerformanceAnalytics>(`/analytics/documents${query}`);
}

export async function getSearchStrategyPlan(query = "") {
  return getJson<SearchStrategyPlan>(`/strategy/current${query}`);
}

export { apiUrl };
