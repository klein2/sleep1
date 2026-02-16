import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Server auth config missing" }, { status: 500 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = typeof data?.total === "number" ? data.total : Array.isArray(data?.users) ? data.users.length : 0;
  return NextResponse.json({ count: total });
}