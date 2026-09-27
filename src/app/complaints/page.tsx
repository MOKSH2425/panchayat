import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-gray-100 text-gray-600",
  under_review: "bg-blue-100 text-blue-600",
  assigned: "bg-purple-100 text-purple-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-600",
  closed: "bg-green-200 text-green-800",
  reopened: "bg-red-100 text-red-600",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-green-400", medium: "bg-yellow-400",
  high: "bg-orange-400", urgent: "bg-red-500",
};

export default async function ComplaintsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, complaint_no, category, description, status, priority, created_at, routing_type")
    .eq("resident_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">My Complaints</h1>
          <p className="text-xs text-gray-400">{complaints?.length || 0} total</p>
        </div>
        <Link href="/complaints/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700 transition">
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {!complaints?.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No complaints yet</p>
            <Link href="/complaints/new" className="text-blue-600 text-sm mt-2 inline-block">Raise your first complaint →</Link>
          </div>
        )}

        {complaints?.map((c) => (
          <Link key={c.id} href={`/complaints/${c.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[c.priority]}`} />
                  <span className="text-xs text-gray-400 font-mono">{c.complaint_no}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 capitalize">{c.category}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 capitalize ${STATUS_STYLES[c.status]}`}>
                {c.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}