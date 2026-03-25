"use client";

import { Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

/**
 * テキスト内のURLを自動的にクリック可能なリンクに変換するコンポーネント
 * 改行も保持される
 */
export function LinkifyText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary break-all underline hover:no-underline"
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
