"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Society = { id: string; name: string };
type Building = { id: string; name: string };
type Flat = { id: string; flat_number: string };

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [societies, setSocieties] = useState<Society[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    society_id: "",
    building_id: "",
    flat_id: "",
  });

  // Load societies on mount
  useEffect(() => {
    supabase.from("societies").select("id, name").then(({ data }) => {
      if (data) setSocieties(data);
    });
  }, []);

  // Load buildings when society changes
  useEffect(() => {
    if (!form.society_id) return;
    supabase
      .from("buildings")
      .select("id, name")
      .eq("society_id", form.society_id)
      .then(({ data }) => {
        if (data) setBuildings(data);
        setForm((f) => ({ ...f, building_id: "", flat_id: "" }));
        setFlats([]);
      });
  }, [form.society_id]);

  // Load flats when building changes
  useEffect(() => {
    if (!form.building_id) return;
    supabase
      .from("flats")
      .select("id, flat_number")
      .eq("building_id", form.building_id)
      .then(({ data }) => {
        if (data) setFlats(data);
        setForm((f) => ({ ...f, flat_id: "" }));
      });
  }, [form.building_id]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Get resident role id
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "resident")
      .single();

    if (!role) { setError("Setup error — please contact support."); setLoading(false); return; }

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      full_name: form.full_name,
      phone: form.phone,
      role_id: role.id,
      flat_id: form.flat_id,
      society_id: form.society_id,
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("This phone number or account already exists.");
      } else {
        setError(insertError.message);
      }
      return;
    }

    router.push("/dashboard/resident");
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🏛️ Panchayat</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your society profile</p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 w-16 rounded-full transition-colors ${step >= s ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">

          {step === 1 && (
            <>
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} required placeholder="Moksh Shah" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input className={inputClass} required placeholder="9876543210" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
              </div>
              <button type="submit" disabled={!form.full_name || !form.phone} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>Select Society</label>
                <select className={inputClass} required value={form.society_id} onChange={(e) => set("society_id", e.target.value)}>
                  <option value="">— Choose your society —</option>
                  {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {buildings.length > 0 && (
                <div>
                  <label className={labelClass}>Select Building / Wing</label>
                  <select className={inputClass} required value={form.building_id} onChange={(e) => set("building_id", e.target.value)}>
                    <option value="">— Choose building —</option>
                    {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              {flats.length > 0 && (
                <div>
                  <label className={labelClass}>Select Flat</label>
                  <select className={inputClass} required value={form.flat_id} onChange={(e) => set("flat_id", e.target.value)}>
                    <option value="">— Choose flat —</option>
                    {flats.map((f) => <option key={f.id} value={f.id}>Flat {f.flat_number}</option>)}
                  </select>
                </div>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  ← Back
                </button>
                <button type="submit" disabled={loading || !form.society_id || !form.building_id || !form.flat_id} className="flex-2 flex-grow bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {loading ? "Saving..." : "Join Society ✓"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}