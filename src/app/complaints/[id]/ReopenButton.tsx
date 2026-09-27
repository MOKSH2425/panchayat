"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReopenButton({ complaintId }: { complaintId: string }) {
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleReopen() {
    setLoading(true);
    await supabase.from("complaints").update({
      status: "reopened",
      reopen_reason: reason || "Not resolved",
      resolved_at: null,
    }).eq("id", complaintId);
    setLoading(false);
    router.refresh();
  }

  if (!shown) {
    return (
      <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-5">
        <p className="text-sm text-yellow-800 font-medium mb-3">Was your issue resolved?</p>
        <div className="flex gap-2">
          <button onClick={() => router.push("/dashboard/resident")} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition">Yes, resolved ✓</button>
          <button onClick={() => setShown(true)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">No, reopen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 rounded-xl border border-red-100 p-5 space-y-3">
      <p className="text-sm text-red-800 font-medium">Why wasn't it resolved?</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional — describe what's still wrong" rows={3}
        className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
      <button onClick={handleReopen} disabled={loading} className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition">
        {loading ? "Reopening..." : "Reopen Complaint"}
      </button>
    </div>
  );
}