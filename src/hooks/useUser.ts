"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserRole } from "@/types";

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

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
        `,
        )
        .eq("id", authUser.id)
        .single();

      if (profile) {
        const roles = profile.roles as unknown as { name: UserRole } | null;
        setUser({
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          flat_id: profile.flat_id,
          society_id: profile.society_id,
          is_active: profile.is_active,
          role: roles?.name ?? "resident",
        });
      }

      setLoading(false);
    }

    fetchUser();
  }, []);

  return { user, loading };
}
