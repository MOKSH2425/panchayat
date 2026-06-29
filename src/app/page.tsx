import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("_test_").select("*").limit(1);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🏛️ Panchayat</h1>
        <p className="text-gray-500">Smart Residential Society Platform</p>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            {error?.code === "42P01"
              ? "✅ Supabase connected! Database is empty — ready to build."
              : error
              ? `❌ Error: ${error.message}`
              : "✅ Supabase connected!"}
          </p>
        </div>
      </div>
    </main>
  );
}