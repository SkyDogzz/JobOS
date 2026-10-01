const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface DashboardJob {
  id: string;
  title: string;
  description: string;
  companyName: string | null;
  location: string | null;
  sourceName: string | null;
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

export interface DashboardResume {
  id: string;
  name: string;
  versionId: string | null;
  versionTitle: string | null;
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
    const [jobs, applications, resumes] = await Promise.all([
      getJson<DashboardJob[]>("/jobs"),
      getJson<DashboardApplication[]>("/applications"),
      getJson<DashboardResume[]>("/resumes")
    ]);

    return { jobs, applications, resumes, apiAvailable: true };
  } catch {
    return {
      jobs: [] as DashboardJob[],
      applications: [] as DashboardApplication[],
      resumes: [] as DashboardResume[],
      apiAvailable: false
    };
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getJobs() {
  return getJson<DashboardJob[]>("/jobs");
}

export async function getResumes() {
  return getJson<DashboardResume[]>("/resumes");
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

export async function getCandidateProfile() {
  return getJson<CandidateProfile | null>("/profile");
}
