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
    const [jobs, applications, resumes, matches] = await Promise.all([
      getJson<DashboardJob[]>("/jobs"),
      getJson<DashboardApplication[]>("/applications"),
      getJson<DashboardResume[]>("/resumes"),
      getJson<MatchSummary[]>("/matches")
    ]);

    return { jobs, applications, resumes, matches, apiAvailable: true };
  } catch {
    return {
      jobs: [] as DashboardJob[],
      applications: [] as DashboardApplication[],
      resumes: [] as DashboardResume[],
      matches: [] as MatchSummary[],
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

export async function getSavedJobFilters() {
  return getJson<SavedJobFilter[]>("/jobs/filters");
}

export async function getSession() {
  return getJson<SessionUser | null>("/auth/session");
}

export { apiUrl };
