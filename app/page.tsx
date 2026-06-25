"use client";

import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";


export default function Home() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTryOn() {
    if (!modelFile || !garmentFile) {
      setError("请先上传人像照片和衣服图片。");
      return;
    }

    setIsLoading(true);
    setError("");
    setResultUrl("");

    try {
      const formData = new FormData();
      formData.append("modelImage", modelFile);
      formData.append("garmentImage", garmentFile);

      const response = await fetch("/api/tryon", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as { resultUrl?: string; error?: string };

      if (!response.ok || !data.resultUrl) {
        throw new Error(data.error || "生成失败，请稍后重试。");
      }

      setResultUrl(data.resultUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "发生未知错误。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
              Virtual Try-On MVP
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-neutral-950 sm:text-5xl">
              AI 虚拟试衣间
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
              上传一张清晰人像和一张服装图片，系统会生成试穿效果图。API Key 只保存在后端环境变量中。
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white/72 px-4 py-3 text-sm text-neutral-600 shadow-sm">
            建议使用单人、正面、光线清晰的照片
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-white/80 bg-white/58 p-4 shadow-soft backdrop-blur sm:p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUploader
                title="人像照片"
                description="上传需要试穿的用户照片。"
                file={modelFile}
                onChange={setModelFile}
                disabled={isLoading}
              />
              <ImageUploader
                title="衣服图片"
                description="上传上衣、下装或连衣裙图片。"
                file={garmentFile}
                onChange={setGarmentFile}
                disabled={isLoading}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleTryOn}
                disabled={isLoading || !modelFile || !garmentFile}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isLoading ? "生成中..." : "开始试穿"}
              </button>

              <p className="text-sm leading-6 text-neutral-500">
                上传和生成通常需要几十秒，结果会显示在右侧或下方。
              </p>
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <aside className="rounded-lg border border-neutral-200 bg-neutral-950 p-4 text-white shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">生成结果</h2>
                <p className="mt-1 text-sm text-white/58">fal.ai FASHN v1.6</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                Preview
              </span>
            </div>

            <div className="mt-5 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-white/7">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-white/72">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">正在生成试衣效果</span>
                </div>
              ) : resultUrl ? (
                <Image src={resultUrl} alt="AI 试穿结果" width={900} height={1125} className="h-full w-full object-cover" />
              ) : (
                <div className="max-w-[14rem] px-4 text-center text-sm leading-6 text-white/48">
                  上传两张图片后，试穿结果会出现在这里。
                </div>
              )}
            </div>

            {resultUrl ? (
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                打开原图
              </a>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
