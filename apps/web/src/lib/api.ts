const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface DashboardJob {
  id: string;
  title: string;
  companyName: string | null;
  location: string | null;
}

export interface DashboardApplication {
  id: string;
  stage: string;
  jobTitle: string;
  companyName: string | null;
}

export interface DashboardResume {
  id: string;
  name: string;
  versionId: string | null;
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
