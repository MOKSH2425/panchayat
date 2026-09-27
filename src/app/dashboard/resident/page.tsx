import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Bell, MessageCircle } from "lucide-react";

export default async function ResidentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, society_id, flat_id, flats(flat_number), societies(name)")
    .eq("id", user.id)
    .single();

  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, complaint_no, category, status, priority, created_at")
    .eq("resident_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, category, is_emergency, created_at")
    .eq("society_id", profile?.society_id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(3);

  const openCount = complaints?.filter(c => !["closed", "resolved"].includes(c.status)).length || 0;

  const STATUS_STYLES: Record<string, string> = {
    submitted: "bg-gray-100 text-gray-600",
    under_review: "bg-blue-100 text-blue-600",
    assigned: "bg-purple-100 text-purple-600",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-600",
    closed: "bg-green-200 text-green-800",
    reopened: "bg-red-100 text-red-600",
  };

  const societyName = (profile?.societies as any)?.name || "Your Society";
  const flatNumber = (profile?.flats as any)?.flat_number;
  const name = profile?.full_name?.split(" ")[0] || "Resident";

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 px-5 pt-10 pb-16">
        <p className="text-blue-200 text-sm">Welcome back,</p>
        <h1 className="text-white text-2xl font-bold mt-0.5">{name} 👋</h1>
        <p className="text-blue-200 text-xs mt-1">{societyName}{flatNumber ? ` · Flat ${flatNumber}` : ""}</p>
      </div>

      <div className="px-4 -mt-10 space-y-4 max-w-lg mx-auto">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: complaints?.length || 0, color: "text-gray-700" },
            { label: "Open", value: openCount, color: "text-blue-600" },
            { label: "Resolved", value: (complaints?.length || 0) - openCount, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/complaints/new" className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-blue-700 transition">
            <div className="bg-blue-500 p-2 rounded-lg"><Plus size={20} /></div>
            <div><p className="font-medium text-sm">New Complaint</p><p className="text-blue-200 text-xs">Raise an issue</p></div>
          </Link>
          <Link href="/complaints" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 transition shadow-sm">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><FileText size={20} /></div>
            <div><p className="font-medium text-sm text-gray-800">My Complaints</p><p className="text-gray-400 text-xs">Track status</p></div>
          </Link>
          <Link href="/notices" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 transition shadow-sm">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Bell size={20} /></div>
            <div><p className="font-medium text-sm text-gray-800">Notices</p><p className="text-gray-400 text-xs">Announcements</p></div>
          </Link>
          <Link href="/assistant" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 transition shadow-sm">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><MessageCircle size={20} /></div>
            <div><p className="font-medium text-sm text-gray-800">Ask Panchayat</p><p className="text-gray-400 text-xs">Society rules AI</p></div>
          </Link>
        </div>

        {/* Recent complaints */}
        {complaints && complaints.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 pt-4 pb-2 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800">Recent Complaints</p>
              <Link href="/complaints" className="text-xs text-blue-600">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {complaints.map((c) => (
                <Link key={c.id} href={`/complaints/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm text-gray-800 capitalize font-medium">{c.category}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.complaint_no}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[c.status]}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent notices */}
        {notices && notices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 pt-4 pb-2 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800">Latest Notices</p>
              <Link href="/notices" className="text-xs text-blue-600">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {notices.map((n) => (
                <Link key={n.id} href={`/notices/${n.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <span className="text-lg">{n.is_emergency ? "🚨" : n.category === "meeting" ? "📅" : n.category === "payment" ? "💰" : "📢"}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{n.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}