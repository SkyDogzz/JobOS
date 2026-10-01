export type ApplicationStage =
  | "wishlist"
  | "saved"
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "accepted";

export interface ApplicationSummary {
  id: string;
  jobTitle: string;
  companyName: string;
  stage: ApplicationStage;
  appliedAt: string | null;
}

export interface JobSummary {
  id: string;
  title: string;
  companyName: string | null;
  location: string | null;
  sourceName: string | null;
}

