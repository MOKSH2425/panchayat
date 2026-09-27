"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mic, MicOff, Send, ArrowLeft, Image } from "lucide-react";

const CATEGORIES = [
  "Plumbing", "Electrical", "Lift", "Parking",
  "Noise", "Security", "Cleaning", "Generator",
  "Water", "Pest Control", "Gate", "Other"
];

const AUTO_ROUTE = ["Plumbing", "Electrical", "Lift", "Cleaning", "Generator", "Water", "Gate", "Security"];

export default function NewComplaintPage() {
  const router = useRouter();
  const supabase = createClient();

  const [inputType, setInputType] = useState<"voice" | "text">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const recognitionRef = useRef<any>(null);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Voice not supported in this browser. Use Chrome."); return; }
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setDescription(transcript);
    };
    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => { setIsRecording(false); };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    setInputType("voice");
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function generateComplaintNo() {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `PNC-${year}-${rand}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !category) { setError("Please fill description and category."); return; }
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("users").select("flat_id, society_id").eq("id", user.id).single();
    if (!profile) { setError("Profile not found. Please complete onboarding."); setLoading(false); return; }

    let attachment_urls: string[] = [];

    // Upload image if provided
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `complaints/${user.id}/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage.from("attachments").upload(path, imageFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
        attachment_urls = [urlData.publicUrl];
      }
    }

    const routing_type = AUTO_ROUTE.includes(category) ? "auto" : "approval";

    const { error: insertError } = await supabase.from("complaints").insert({
      complaint_no: generateComplaintNo(),
      society_id: profile.society_id,
      resident_id: user.id,
      flat_id: profile.flat_id,
      category: category.toLowerCase(),
      priority,
      routing_type,
      status: "submitted",
      input_type: inputType,
      description,
      attachment_urls,
      is_anonymous: true,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    router.push("/dashboard/resident?submitted=1");
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white";

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h1 className="font-semibold text-gray-900">Raise Complaint</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Voice / Text toggle */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium mb-3">INPUT METHOD</p>
            <div className="flex gap-3 items-start">
              <button type="button" onClick={isRecording ? stopVoice : startVoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isRecording ? "bg-red-500 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                {isRecording ? <><MicOff size={16} /> Stop Recording</> : <><Mic size={16} /> Record Voice</>}
              </button>
              {isRecording && <span className="text-xs text-red-500 animate-pulse mt-2">● Recording...</span>}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="text-xs text-gray-500 font-medium mb-2 block">DESCRIPTION *</label>
            <textarea required rows={4} value={description} onChange={(e) => { setDescription(e.target.value); setInputType("text"); }}
              placeholder="Describe the issue in detail..." className={inputClass + " resize-none"} />
          </div>

          {/* Category + Priority */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-2 block">CATEGORY *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${category === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-2 block">PRIORITY</label>
              <div className="flex gap-2">
                {["low", "medium", "high", "urgent"].map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border capitalize transition ${priority === p
                      ? p === "urgent" ? "bg-red-500 text-white border-red-500"
                        : p === "high" ? "bg-orange-500 text-white border-orange-500"
                          : p === "medium" ? "bg-yellow-500 text-white border-yellow-500"
                            : "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="text-xs text-gray-500 font-medium mb-2 block">ATTACH PHOTO (optional)</label>
            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
              <Image size={16} />
              {imageFile ? imageFile.name : "Choose image..."}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {category && (
            <p className="text-xs text-gray-400 px-1">
              {AUTO_ROUTE.includes(category) ? "⚡ This will be auto-routed to the maintenance team." : "📋 This requires secretary approval before routing."}
            </p>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </main>
  );
}