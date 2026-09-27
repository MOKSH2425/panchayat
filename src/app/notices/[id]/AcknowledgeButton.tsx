"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  noticeId: string;
  userId: string;
  existingAck: any;
  requiresAck: boolean;
  isEvent: boolean;
};

export default function AcknowledgeButton({ noticeId, userId, existingAck, requiresAck, isEvent }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!existingAck);
  const supabase = createClient();
  const router = useRouter();

  async function acknowledge(rsvp?: string) {
    setLoading(true);
    await supabase.from("notice_acknowledgements").upsert({
      notice_id: noticeId,
      user_id: userId,
      acknowledged_at: new Date().toISOString(),
      rsvp_response: rsvp || null,
    }, { onConflict: "notice_id,user_id" });
    setLoading(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
        <p className="text-green-700 text-sm font-medium">✓ Acknowledged</p>
        {existingAck?.rsvp_response && <p className="text-green-600 text-xs mt-1 capitalize">RSVP: {existingAck.rsvp_response}</p>}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      {requiresAck && (
        <button onClick={() => acknowledge()} disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? "Saving..." : "✓ I Have Read This"}
        </button>
      )}
      {isEvent && (
        <div>
          <p className="text-xs text-blue-700 font-medium mb-2 text-center">RSVP</p>
          <div className="flex gap-2">
            {["yes", "no", "maybe"].map((r) => (
              <button key={r} onClick={() => acknowledge(r)} disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 capitalize transition">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}