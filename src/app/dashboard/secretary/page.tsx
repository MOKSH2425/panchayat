import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SecretaryDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🏛️ Panchayat</h1>
        <p className="text-gray-500 text-sm mb-6">Secretary Dashboard</p>
        <p className="text-sm text-gray-600">Logged in as: {user.email}</p>
      </div>
    </main>
  );
}