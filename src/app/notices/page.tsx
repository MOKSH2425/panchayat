import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CATEGORY_ICON: Record<string, string> = {
  general: "📢", emergency: "🚨", meeting: "📅", event: "🎉", payment: "💰"
};

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("society_id").eq("id", user.id).single();

  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, category, body, is_emergency, requires_acknowledgement, created_at")
    .eq("society_id", profile?.society_id)
    .eq("is_deleted", false)
    .order("is_emergency", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard/resident" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-semibold text-gray-900">Notice Board</h1>
          <p className="text-xs text-gray-400">{notices?.length || 0} notices</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {!notices?.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No notices yet</p>
          </div>
        )}
        {notices?.map((n) => (
          <Link key={n.id} href={`/notices/${n.id}`}
            className={`block rounded-xl border p-4 hover:shadow-sm transition ${n.is_emergency ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{CATEGORY_ICON[n.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${n.is_emergency ? "text-red-800" : "text-gray-800"}`}>{n.title}</p>
                  {n.is_emergency && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">URGENT</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  {n.requires_acknowledgement && <span className="text-xs text-blue-600">Acknowledgement required</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}