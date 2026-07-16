import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // 本番デプロイ用: standaloneモードでビルドすることで、node_modulesを含まない
  // 最小限の自己完結型出力を生成する。Dockerイメージサイズの大幅な削減に寄与。
  // .next/standalone/server.js を直接実行することで本番サーバーが起動する。
  output: "standalone",
};

export default nextConfig;
