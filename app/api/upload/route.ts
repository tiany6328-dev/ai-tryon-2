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
    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET ||
      process.env.SUPABASE_BUCKET ||
      "tryon-uploads-2";

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return NextResponse.json(
        { error: "No image file received." },
        { status: 400 }
      );
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const path = getSafeUploadName(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError);
      return NextResponse.json(
        {
          error:
            "Failed to upload image to Supabase Storage. Please check bucket name, service role key, and storage permissions."
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!data.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get Supabase image URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Upload failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Image upload failed. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
