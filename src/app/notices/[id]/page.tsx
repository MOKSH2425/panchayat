import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AcknowledgeButton from "./AcknowledgeButton";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notice } = await supabase.from("notices").select("*").eq("id", id).single();
  if (!notice) notFound();

  const { data: ack } = await supabase
    .from("notice_acknowledgements")
    .select("id, acknowledged_at, rsvp_response")
    .eq("notice_id", id)
    .eq("user_id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/notices" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="font-semibold text-gray-900 truncate">{notice.title}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {notice.is_emergency && (
          <div className="bg-red-500 text-white rounded-xl p-4 text-center font-medium">
            🚨 Emergency Notice — Action Required
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">{notice.category}</span>
            <span className="text-xs text-gray-400">{new Date(notice.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{notice.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.body}</p>
          {notice.attachment_url && (
            <a href={notice.attachment_url} target="_blank" className="text-blue-600 text-sm underline mt-3 block">View attachment →</a>
          )}
        </div>

        {(notice.requires_acknowledgement || notice.category === "meeting" || notice.category === "event") && (
          <AcknowledgeButton
            noticeId={id}
            existingAck={ack}
            requiresAck={notice.requires_acknowledgement}
            isEvent={notice.category === "meeting" || notice.category === "event"}
            userId={user.id}
          />
        )}
      </div>
    </main>
  );
}