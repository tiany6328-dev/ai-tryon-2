import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSafeUploadName, validateImageFile } from "@/lib/validation";

export const runtime = "nodejs";

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "type" in value &&
    "size" in value &&
    "name" in value
  );
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET;
    const missingVariables = [
      ["SUPABASE_URL", supabaseUrl],
      ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
      ["SUPABASE_BUCKET", bucket]
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missingVariables.length > 0) {
      return NextResponse.json(
        { error: `Missing Supabase environment variables: ${missingVariables.join(", ")}.` },
        { status: 500 }
      );
    }

    const resolvedSupabaseUrl = supabaseUrl as string;
    const resolvedServiceRoleKey = serviceRoleKey as string;
    const resolvedBucket = bucket as string;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return NextResponse.json({ error: "No image file received." }, { status: 400 });
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = createClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const path = getSafeUploadName(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage.from(resolvedBucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false
    });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(resolvedBucket).getPublicUrl(path);

    if (!data.publicUrl) {
      return NextResponse.json({ error: "Failed to get Supabase image URL." }, { status: 500 });
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Upload failed:", error);

    const message = error instanceof Error ? error.message : "Image upload failed. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
