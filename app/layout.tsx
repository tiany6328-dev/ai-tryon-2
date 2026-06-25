import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 虚拟试衣 MVP",
  description: "上传人像和服装图片，通过 fal.ai FASHN try-on 模型生成虚拟试衣效果。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
