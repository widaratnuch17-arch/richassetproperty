"use client";

import { useEffect } from "react";

export type ClientAttribution = {
  source: string;
  medium: string;
  campaign: string;
  referrerHost: string;
};

const ATTRIBUTION_KEY = "rap:attribution";

function limited(value: string | null, maxLength: number) {
  return (value ?? "").trim().slice(0, maxLength);
}

export function getClientAttribution(): ClientAttribution {
  if (typeof window === "undefined") {
    return { source: "direct", medium: "", campaign: "", referrerHost: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const taggedSource = limited(params.get("utm_source"), 60).toLowerCase();
  const tagged = {
    source: taggedSource,
    medium: limited(params.get("utm_medium"), 60).toLowerCase(),
    campaign: limited(params.get("utm_campaign"), 100),
    referrerHost: "",
  };

  if (taggedSource) {
    try {
      tagged.referrerHost = document.referrer ? new URL(document.referrer).hostname.slice(0, 160) : "";
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(tagged));
    } catch {
      // Attribution is helpful but must never block the property page.
    }
    return tagged;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null") as Partial<ClientAttribution> | null;
    if (stored?.source) {
      return {
        source: limited(stored.source, 60).toLowerCase(),
        medium: limited(stored.medium ?? "", 60).toLowerCase(),
        campaign: limited(stored.campaign ?? "", 100),
        referrerHost: limited(stored.referrerHost ?? "", 160).toLowerCase(),
      };
    }
  } catch {
    // Fall back to a first-party referrer label.
  }

  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.slice(0, 160).toLowerCase() : "";
  } catch {
    referrerHost = "";
  }

  return {
    source: referrerHost || "direct",
    medium: referrerHost ? "referral" : "",
    campaign: "",
    referrerHost,
  };
}

export function sendPropertyEvent(propertyId: string, eventType: string) {
  const attribution = getClientAttribution();
  const id = crypto.randomUUID();
  const payload = JSON.stringify({ id, propertyId, eventType, ...attribution });

  if (eventType !== "view" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/property-events", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/property-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

export function PropertyAnalytics({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const attribution = getClientAttribution();
    const viewKey = `rap:view:${propertyId}:${attribution.source}:${attribution.campaign}`;
    try {
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, "1");
        sendPropertyEvent(propertyId, "view");
      }
    } catch {
      sendPropertyEvent(propertyId, "view");
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const tracked = target?.closest<HTMLElement>("[data-property-event]");
      const eventType = tracked?.dataset.propertyEvent;
      if (eventType) sendPropertyEvent(propertyId, eventType);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [propertyId]);

  return null;
}
