"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Loader2, Plus } from "lucide-react";
import type { ApplicationOffer } from "../../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function OffersPanel({ applicationId, initialOffers }: { applicationId: string; initialOffers: ApplicationOffer[] }) {
  const router = useRouter();
  const [offers, setOffers] = useState(initialOffers);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  async function createOffer(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/applications/${applicationId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baseCompensation: Number(formData.get("baseCompensation") ?? 0),
          currency: String(formData.get("currency") ?? "USD"),
          equity: String(formData.get("equity") ?? "") || undefined,
          benefits: String(formData.get("benefits") ?? "") || undefined,
          deadlineAt: String(formData.get("deadlineAt") ?? "") ? new Date(String(formData.get("deadlineAt"))).toISOString() : undefined,
          negotiationNotes: String(formData.get("negotiationNotes") ?? "") || undefined,
          marketBaseline: Number(formData.get("marketBaseline") ?? 0) || undefined
        })
      });
      if (!response.ok) throw new Error("Could not save offer.");
      const offer = await response.json() as ApplicationOffer;
      setOffers((current) => [...current, offer].sort((a, b) => b.decisionScore - a.decisionScore));
      setMessage("Offer saved and reminders generated.");
      startRefresh(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save offer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-4 rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <BadgeDollarSign size={18} />
        <h2 className="font-semibold">Offers</h2>
      </div>
      <form action={createOffer} className="mb-5 grid gap-3 md:grid-cols-3">
        <Input label="Base comp" name="baseCompensation" placeholder="165000" type="number" required />
        <Input label="Market baseline" name="marketBaseline" placeholder="155000" type="number" />
        <Input label="Currency" name="currency" placeholder="USD" />
        <Input label="Equity" name="equity" placeholder="0.15% / RSUs" />
        <Input label="Benefits" name="benefits" placeholder="Health, 401k, remote" />
        <Input label="Deadline" name="deadlineAt" type="datetime-local" />
        <label className="block text-sm md:col-span-3">
          <span className="mb-1 block font-medium text-ink/70">Negotiation notes</span>
          <textarea className="min-h-20 w-full rounded border border-ink/15 px-3 py-2" name="negotiationNotes" placeholder="Counter, constraints, recruiter commitments" />
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white disabled:bg-ink/35" disabled={pending} type="submit">
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Save offer
        </button>
      </form>
      {offers.length === 0 ? <p className="text-sm text-ink/55">No offers yet.</p> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {offers.map((offer) => (
          <article className="rounded border border-ink/10 bg-paper p-4" key={offer.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{offer.currency} {offer.baseCompensation.toLocaleString()}</p>
                <p className="mt-1 text-sm text-ink/60">{offer.equity ?? "No equity"} · {offer.benefits ?? "No benefits captured"}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold">{offer.decisionScore}</p>
                <p className="text-xs uppercase text-ink/45">score</p>
              </div>
            </div>
            {offer.deadlineAt ? <p className="mt-3 text-sm text-rust">Deadline {new Date(offer.deadlineAt).toLocaleString()}</p> : null}
            {offer.negotiationNotes ? <p className="mt-3 text-sm text-ink/65">{offer.negotiationNotes}</p> : null}
            <p className="mt-3 rounded bg-white px-3 py-2 text-sm text-ink/65">{String(offer.comparison.notes ?? "No comparison note.")}</p>
          </article>
        ))}
      </div>
      {message || isRefreshing ? <p className="mt-3 text-xs text-ink/55">{isRefreshing ? "Refreshing." : message}</p> : null}
    </section>
  );
}

function Input({ label, name, placeholder, type = "text", required }: { label: string; name: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink/70">{label}</span>
      <input className="h-10 w-full rounded border border-ink/15 px-3" name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}
