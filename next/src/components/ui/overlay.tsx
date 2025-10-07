"use client";

import React from "react";
import { overlayStore } from "@/stores/useOverlayStore";

/**
 * APIアクセスやページローディング時に使う全画面オーバーレイ。
 * - openフラグがtrueで表示、falseで非表示
 * - フェードイン/アウト（opacityのトランジション）
 * - 黒基調・半透明
 * - 中央に円形ローディングアイコン
 */
export default function Overlay() {
  const open = overlayStore((s) => s.open);

  return (
    <div
      // 画面全体を覆う
      className={[
        "test",
        "fixed inset-0 z-50",
        // 黒・半透明
        "bg-black/60",
        // フェード（ユーザーの簡易動作設定も尊重）
        "transition-opacity duration-300 ease-out",
        "motion-reduce:transition-none",
        // 開閉でopacityとpointer-eventsを切替
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        // レイアウトジャンプ防止
        "flex items-center justify-center",
      ].join(" ")}
      aria-hidden={!open}
      role="status"
      aria-live="polite"
    >
      {/* スピナー */}
      <div
        className={[
          "h-12 w-12 rounded-full",
          "border-4 border-white/70",
          "border-t-transparent", // 上だけ透明でスピナー感
          "animate-spin",
          "motion-reduce:animate-none",
          // 微妙に発光感
          "shadow-[0_0_32px_rgba(255,255,255,0.25)]",
        ].join(" ")}
        aria-label="Loading"
      />
      {/* スクリーンリーダー向けテキスト（視覚非表示） */}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
