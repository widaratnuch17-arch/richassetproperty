"use client";

import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createListingContentKit } from "../content-templates";
import type { Property, PropertyStatus } from "../data/properties";

const statusLabels: Record<PropertyStatus, string> = {
  active: "พร้อมขาย",
  reserved: "ติดจอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อนรายการ",
};

type ContentKey = "facebook" | "shortCaption" | "portal";

export function ListingContentKit({
  properties,
  initialPropertyId,
  siteUrl,
}: {
  properties: Property[];
  initialPropertyId?: string;
  siteUrl: string;
}) {
  const initialProperty =
    properties.find((property) => property.id === initialPropertyId) ??
    properties.find((property) => property.status === "active") ??
    properties[0];
  const [selectedId, setSelectedId] = useState(initialProperty?.id ?? "");
  const [copied, setCopied] = useState<ContentKey | null>(null);
  const property =
    properties.find((candidate) => candidate.id === selectedId) ?? initialProperty;
  const content = useMemo(
    () => (property ? createListingContentKit(property, siteUrl) : null),
    [property, siteUrl],
  );

  if (!property || !content) {
    return <p className="admin-empty">ยังไม่มีข้อมูลทรัพย์สำหรับสร้างข้อความ</p>;
  }

  const status = property.status ?? "active";
  const canPublish = status === "active";

  async function copyText(key: ContentKey) {
    if (!canPublish) return;
    const text = content![key];
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.focus();
    fallback.select();
    fallback.setSelectionRange(0, text.length);
    const copiedWithFallback = document.execCommand("copy");
    fallback.remove();

    if (!copiedWithFallback && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    }

    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1800);
  }

  const panels: Array<{
    key: ContentKey;
    title: string;
    description: string;
    icon: typeof FileText;
    text: string;
  }> = [
    {
      key: "facebook",
      title: "โพสต์ Facebook",
      description: "ข้อความฉบับเต็ม มีรายละเอียด จุดเด่น และช่องทางติดต่อ",
      icon: FileText,
      text: content.facebook,
    },
    {
      key: "shortCaption",
      title: "แคปชันสั้น",
      description: "เหมาะสำหรับ TikTok, Reels, Lemon8 และ LINE VOOM",
      icon: Smartphone,
      text: content.shortCaption,
    },
    {
      key: "portal",
      title: "ข้อความเว็บประกาศ",
      description: "รูปแบบอ่านง่ายสำหรับคัดลอกไปวางในเว็บไซต์อสังหาฯ",
      icon: Globe2,
      text: content.portal,
    },
  ];

  return (
    <>
      <section className="admin-content-picker">
        <div>
          <label htmlFor="content-property">เลือกทรัพย์ที่ต้องการทำคอนเทนต์</label>
          <select
            id="content-property"
            value={property.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setCopied(null);
            }}
          >
            {properties.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title} — {statusLabels[item.status ?? "active"]}
              </option>
            ))}
          </select>
        </div>
        <article className="admin-content-property">
          <span>
            {property.images[0] && (
              <Image src={property.images[0]} alt="" fill sizes="110px" />
            )}
          </span>
          <div>
            <small>{property.type} · {property.location}</small>
            <strong>{property.title}</strong>
            <p>{property.price}</p>
          </div>
          <Link href={`/properties/${property.id}`} target="_blank">
            ดูหน้าเว็บ <ExternalLink />
          </Link>
        </article>
      </section>

      {!canPublish && (
        <p className="admin-content-warning">
          ทรัพย์นี้อยู่ในสถานะ “{statusLabels[status]}” ระบบจึงปิดปุ่มคัดลอกเพื่อป้องกันการนำไปประกาศผิดสถานะ
        </p>
      )}

      <section className="admin-content-grid">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <article className="admin-content-panel" key={panel.key}>
              <header>
                <span><Icon /></span>
                <div>
                  <h2>{panel.title}</h2>
                  <p>{panel.description}</p>
                </div>
              </header>
              <textarea readOnly value={panel.text} aria-label={panel.title} />
              <footer>
                <small>{panel.text.length.toLocaleString("th-TH")} ตัวอักษร</small>
                <button
                  type="button"
                  onClick={() => copyText(panel.key)}
                  disabled={!canPublish}
                >
                  {copied === panel.key ? <Check /> : <Copy />}
                  {copied === panel.key ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
                </button>
              </footer>
            </article>
          );
        })}
      </section>
    </>
  );
}
