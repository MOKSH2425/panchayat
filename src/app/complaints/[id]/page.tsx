import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReopenButton from "./ReopenButton";

const STATUS_TIMELINE = ["submitted", "under_review", "assigned", "in_progress", "resolved", "closed"];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-gray-100 text-gray-600",
  under_review: "bg-blue-100 text-blue-600",
  assigned: "bg-purple-100 text-purple-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-600",
  closed: "bg-green-200 text-green-800",
  reopened: "bg-red-100 text-red-600",
};

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: c } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", id)
    .eq("resident_id", user.id)
    .single();

  if (!c) notFound();

  const timelineSteps = c.status === "reopened"
    ? [...STATUS_TIMELINE, "reopened"]
    : STATUS_TIMELINE;

  const currentIdx = timelineSteps.indexOf(c.status);

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/complaints" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-semibold text-gray-900 font-mono text-sm">{c.complaint_no}</h1>
          <p className="text-xs text-gray-400 capitalize">{c.category}</p>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[c.status]}`}>
          {c.status.replace("_", " ")}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium mb-4">PROGRESS</p>
          <div className="space-y-3">
            {timelineSteps.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition ${done ? active ? "bg-blue-600 text-white" : "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {done && !active ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm capitalize ${active ? "text-blue-700 font-medium" : done ? "text-gray-600" : "text-gray-300"}`}>
                    {step.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium mb-2">DESCRIPTION</p>
          <p className="text-sm text-gray-700">{c.description}</p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <p className="text-xs text-gray-500 font-medium mb-2">DETAILS</p>
          {[
            ["Priority", c.priority],
            ["Routing", c.routing_type],
            ["Submitted", new Date(c.created_at).toLocaleString("en-IN")],
            c.resolved_at && ["Resolved", new Date(c.resolved_at).toLocaleString("en-IN")],
          ].filter(Boolean).map(([k, v]: any) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-700 capitalize">{v}</span>
            </div>
          ))}
        </div>

        {/* Resolution proof */}
        {c.resolution_note && (
          <div className="bg-green-50 rounded-xl border border-green-100 p-5">
            <p className="text-xs text-green-700 font-medium mb-2">RESOLUTION NOTE</p>
            <p className="text-sm text-green-800">{c.resolution_note}</p>
            {c.proof_url && <a href={c.proof_url} target="_blank" className="text-xs text-green-600 underline mt-2 block">View proof image →</a>}
          </div>
        )}

        {/* Reopen button */}
        {c.status === "resolved" && <ReopenButton complaintId={c.id} />}

        {/* Image attachments */}
        {c.attachment_urls?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 font-medium mb-3">ATTACHMENTS</p>
            <div className="flex gap-2 flex-wrap">
              {c.attachment_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank">
                  <img src={url} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}