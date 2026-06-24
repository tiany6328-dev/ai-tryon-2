import Fashn from "fashn";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type TryonRequest = {
  modelImageUrl?: string;
  garmentImageUrl?: string;
};

function normalizeOutput(output: unknown): string | null {
  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output)) {
    const first = output[0];

    if (typeof first === "string") {
      return first;
    }

    if (first && typeof first === "object") {
      const maybeUrl = (first as { url?: unknown }).url;
      return typeof maybeUrl === "string" ? maybeUrl : null;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.FASHN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "缺少 FASHN_API_KEY，请先在 .env.local 中配置。" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as TryonRequest;

    if (!body.modelImageUrl || !body.garmentImageUrl) {
      return NextResponse.json({ error: "缺少人像图片 URL 或衣服图片 URL。" }, { status: 400 });
    }

    const client = new Fashn({ apiKey });

    const prediction = await client.predictions.subscribe({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: body.modelImageUrl,
        garment_image: body.garmentImageUrl,
        category: "auto"
      }
    } as Parameters<typeof client.predictions.subscribe>[0]);

    const resultUrl = normalizeOutput(prediction.output);

    if (!resultUrl) {
      return NextResponse.json(
        {
          error: "FASHN 已返回结果，但没有找到可展示的图片 URL。",
          raw: prediction
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ resultUrl });
  } catch (error) {
    console.error("FASHN try-on failed:", error);

    const message =
      error instanceof Error ? error.message : "生成失败，请检查图片和 API Key 后重试。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
