import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user?.id)
        .single();

      if (userProfile) {
        return NextResponse.redirect(`${origin}/dashboard/resident`);
      } else {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}