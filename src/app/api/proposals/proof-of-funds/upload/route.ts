import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function safeFilename(name: string) {
  return name
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120) || "proof-of-funds";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ ok: false, error: "Empty file." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "File is too large (max 15MB)." }, { status: 413 });
  }

  const bucket = process.env.SUPABASE_PROPOSAL_DOCS_BUCKET || "proposal-documents";
  const ext = safeFilename(file.name);
  const path = `proof-of-funds/${user.id}/${Date.now()}-${ext}`;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Storage is not configured.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path, bucket }, { status: 200 });
}

