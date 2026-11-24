"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckIcon, LinkIcon, ShareIcon } from "@/components/share-icons";

type ShareActionsProps = {
  url: string;
  title: string;
};

function noSubscription() {
  return () => {};
}

/** "Copy link", plus the phone's own share sheet where the browser has one. */
export function ShareActions({ url, title }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  // False on the server and during hydration, so both renders match; then the browser's answer.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Cancelled by the reader.
    }
  }

  return (
    <>
      <li>
        <button
          type="button"
          className="share-links__icon"
          onClick={copy}
          aria-label={copied ? "Link copied" : "Copy link"}
          title={copied ? "Link copied" : "Copy link"}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
        <span className="share-links__status" role="status">
          {copied ? "Copied" : ""}
        </span>
      </li>
      {canShare ? (
        <li>
          <button
            type="button"
            className="share-links__icon"
            onClick={share}
            aria-label="More ways to share"
            title="More ways to share"
          >
            <ShareIcon />
          </button>
        </li>
      ) : null}
    </>
  );
}
