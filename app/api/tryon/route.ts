import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type TryonRequest = {
  modelImageUrl?: string;
  garmentImageUrl?: string;
};

type FalQueueResponse = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
  status?: string;
};

type FalTryonResult = {
  images?: Array<{
    url?: string;
  }>;
};

async function readFalError(response: Response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text) as { detail?: unknown; error?: unknown };
    const detail = data.detail || data.error;
    return typeof detail === "string" ? detail : text;
  } catch {
    return text;
  }
}

async function waitForFalResult(statusUrl: string, responseUrl: string, apiKey: string) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const statusResponse = await fetch(statusUrl, {
      headers: {
        Authorization: `Key ${apiKey}`
      },
      cache: "no-store"
    });

    if (!statusResponse.ok) {
      throw new Error(await readFalError(statusResponse));
    }

    const statusData = (await statusResponse.json()) as { status?: string };

    if (statusData.status === "COMPLETED") {
      const resultResponse = await fetch(responseUrl, {
        headers: {
          Authorization: `Key ${apiKey}`
        },
        cache: "no-store"
      });

      if (!resultResponse.ok) {
        throw new Error(await readFalError(resultResponse));
      }

      return (await resultResponse.json()) as FalTryonResult;
    }

    if (statusData.status === "FAILED") {
      throw new Error("fal.ai generation failed. Please check your images and FAL_KEY.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("fal.ai generation timed out. Please try again.");
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

    const body = (await request.json()) as TryonRequest;

    if (!body.modelImageUrl || !body.garmentImageUrl) {
      return NextResponse.json({ error: "Missing model image URL or garment image URL." }, { status: 400 });
    }

    const submitResponse = await fetch("https://queue.fal.run/fal-ai/fashn/tryon/v1.6", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_image: body.modelImageUrl,
        garment_image: body.garmentImageUrl,
        category: "auto",
        mode: "balanced",
        garment_photo_type: "auto",
        moderation_level: "permissive",
        num_samples: 1,
        segmentation_free: true,
        output_format: "png"
      })
    });

    if (!submitResponse.ok) {
      const detail = await readFalError(submitResponse);
      const isExhaustedBalance = /exhausted balance|top up your balance/i.test(detail);
      const message =
        submitResponse.status === 403
          ? isExhaustedBalance
            ? "fal.ai returned Forbidden (403): your fal.ai balance is exhausted. Please top up your balance at fal.ai/dashboard/billing, then try again."
            : "fal.ai returned Forbidden (403). Please check that FAL_KEY is valid, your fal.ai account has credits, and the key can run fal-ai/fashn/tryon/v1.6."
          : detail || "fal.ai request failed.";

      return NextResponse.json({ error: message }, { status: submitResponse.status });
    }

    const queueData = (await submitResponse.json()) as FalQueueResponse;

    if (!queueData.status_url || !queueData.response_url) {
      return NextResponse.json(
        { error: "fal.ai did not return queue URLs.", raw: queueData },
        { status: 502 }
      );
    }

    const result = await waitForFalResult(queueData.status_url, queueData.response_url, apiKey);
    const resultUrl = result.images?.[0]?.url;

    if (!resultUrl) {
      return NextResponse.json(
        { error: "fal.ai returned a result, but no output image URL was found.", raw: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ resultUrl });
  } catch (error) {
    console.error("fal.ai try-on failed:", error);

    const message = error instanceof Error ? error.message : "Generation failed. Please check your images and FAL_KEY.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
