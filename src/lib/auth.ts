import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      phone,
      flat_id,
      society_id,
      is_active,
      roles (name)
    `
    )
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    phone: profile.phone,
    flat_id: profile.flat_id,
    society_id: profile.society_id,
    is_active: profile.is_active,
    role: (profile.roles as unknown as { name: UserRole } | null)?.name ?? "resident",
  };
}

// Check if user has permission for a given role or above
export function hasRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const hierarchy: UserRole[] = [
    "resident",
    "secretary",
    "chairman",
    "builder",
  ];
  return (
    hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
  );
}