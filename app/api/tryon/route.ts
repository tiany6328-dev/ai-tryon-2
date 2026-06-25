import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";
import { validateImageFile } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

type FalTryonResult = {
  images?: Array<{
    url?: string;
  }>;
};

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

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object") {
    const maybeStatus = (error as { status?: unknown; statusCode?: unknown }).status;
    const maybeStatusCode = (error as { status?: unknown; statusCode?: unknown }).statusCode;

    if (typeof maybeStatus === "number") {
      return maybeStatus;
    }

    if (typeof maybeStatusCode === "number") {
      return maybeStatusCode;
    }
  }

  return undefined;
}

function getErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const possibleError = error as {
    body?: unknown;
    detail?: unknown;
    response?: {
      body?: unknown;
      detail?: unknown;
    };
  };

  const detail =
    possibleError.detail ||
    possibleError.response?.detail ||
    (possibleError.body &&
      typeof possibleError.body === "object" &&
      (possibleError.body as { detail?: unknown }).detail) ||
    (possibleError.response?.body &&
      typeof possibleError.response.body === "object" &&
      (possibleError.response.body as { detail?: unknown }).detail);

  return typeof detail === "string" ? detail : "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.FAL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FAL_KEY. Please configure it in your server environment." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const modelImage = formData.get("modelImage");
    const garmentImage = formData.get("garmentImage");

    if (!isUploadFile(modelImage) || !isUploadFile(garmentImage)) {
      return NextResponse.json({ error: "Missing model image file or garment image file." }, { status: 400 });
    }

    const modelValidationError = validateImageFile(modelImage);
    if (modelValidationError) {
      return NextResponse.json({ error: modelValidationError }, { status: 400 });
    }

    const garmentValidationError = validateImageFile(garmentImage);
    if (garmentValidationError) {
      return NextResponse.json({ error: garmentValidationError }, { status: 400 });
    }

    fal.config({
      credentials: apiKey
    });

    const [modelImageUrl, garmentImageUrl] = await Promise.all([
      fal.storage.upload(modelImage),
      fal.storage.upload(garmentImage)
    ]);

    const result = await fal.subscribe("fal-ai/fashn/tryon/v1.6", {
      input: {
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category: "auto",
        mode: "balanced",
        garment_photo_type: "auto",
        moderation_level: "permissive",
        num_samples: 1,
        segmentation_free: true,
        output_format: "png"
      }
    });

    const data = result.data as FalTryonResult;
    const resultUrl = data.images?.[0]?.url;

    if (!resultUrl) {
      return NextResponse.json(
        { error: "fal.ai returned a result, but no output image URL was found.", raw: result.data },
        { status: 502 }
      );
    }

    return NextResponse.json({ resultUrl });
  } catch (error) {
    console.error("fal.ai try-on failed:", error);

    const status = getErrorStatus(error);
    const originalMessage = error instanceof Error ? error.message : "";
    const detail = getErrorDetail(error);
    const combinedMessage = [detail, originalMessage].filter(Boolean).join(" ");
    const isExhaustedBalance = /exhausted balance|top up your balance/i.test(combinedMessage);
    const isForbidden = status === 403 || /forbidden/i.test(combinedMessage);
    const message = isForbidden
      ? isExhaustedBalance
        ? "fal.ai returned Forbidden (403): your fal.ai balance is exhausted. Please top up your balance at fal.ai/dashboard/billing, then try again."
        : "fal.ai returned Forbidden (403). Please check that FAL_KEY is valid, your fal.ai account has credits, and the key can run fal-ai/fashn/tryon/v1.6."
      : detail || originalMessage || "Generation failed. Please check your images and FAL_KEY.";

    return NextResponse.json({ error: message }, { status: status || 500 });
  }
}
