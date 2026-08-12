"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function PropertyShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function shareProperty() {
    const shareData = { title, text: `${title} | Rich Asset Property`, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="property-share"
      onClick={shareProperty}
      data-property-event="share_click"
    >
      {copied ? <Check /> : <Share2 />}
      {copied ? "คัดลอกลิงก์แล้ว" : "แชร์ทรัพย์นี้"}
    </button>
  );
}
