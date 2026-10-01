import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getGroundingReviews } from "../../../lib/api";

export default async function GroundingReviewsPage() {
  const reviews = await getGroundingReviews().catch(() => []);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/documents">
          <ArrowLeft size={16} />
          Documents
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck size={20} />
          <h1 className="text-3xl font-semibold">Grounding Reviews</h1>
        </div>
        {reviews.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-white p-5 text-sm text-ink/55">No claims are waiting for review.</p> : null}
        <div className="grid gap-3">
          {reviews.map((review) => (
            <article className="rounded border border-ink/10 bg-white p-5" key={review.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{review.claim}</p>
                  <p className="mt-1 text-sm text-ink/55">{review.purpose ?? "artifact"} · {review.provider ?? "provider"} · {review.model ?? "model"}</p>
                </div>
                <span className="rounded border border-ink/10 px-2 py-1 text-xs text-ink/60">{review.status}</span>
              </div>
              <pre className="mt-3 overflow-auto rounded bg-paper p-3 text-xs">{JSON.stringify(review.evidence, null, 2)}</pre>
              {review.reviewerNote ? <p className="mt-3 text-sm text-ink/65">{review.reviewerNote}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
