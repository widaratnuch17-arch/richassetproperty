"use client";

import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Megaphone,
  Search,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContentChannel, ContentScheduleItem } from "../../db/content-schedule";
import type { Property, PropertyStatus } from "../data/properties";

const channels: ContentChannel[] = [
  "facebook",
  "tiktok",
  "youtube",
  "lemon8",
  "line_voom",
  "property_portal",
];

const channelLabels: Record<ContentChannel, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  lemon8: "Lemon8",
  line_voom: "LINE VOOM",
  property_portal: "เว็บประกาศอสังหาฯ",
};

const statusLabels: Record<PropertyStatus, string> = {
  active: "พร้อมขาย",
  reserved: "ติดจอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อนรายการ",
};

type ReportFilter = PropertyStatus | "all";

function bangkokNowValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const date = value.length === 16
    ? new Date(`${value}:00+07:00`)
    : new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function MarketingReport({
  properties,
  items,
  generatedAt,
}: {
  properties: Property[];
  items: ContentScheduleItem[];
  generatedAt: string;
}) {
  const [filter, setFilter] = useState<ReportFilter>("active");
  const [query, setQuery] = useState("");
  const now = bangkokNowValue();

  const reports = useMemo(() => properties.map((property) => {
    const propertyItems = items.filter((item) => item.propertyId === property.id);
    const postedItems = propertyItems.filter((item) => item.status === "posted");
    const plannedItems = propertyItems.filter((item) => item.status === "planned");
    const postedChannels = [...new Set(postedItems.map((item) => item.channel))];
    const missingChannels = channels.filter((channel) => !postedChannels.includes(channel));
    const overdueItems = plannedItems.filter((item) => item.scheduledFor < now);
    const linkedPosts = postedItems.filter((item) => item.postUrl);
    const recentPosted = [...postedItems].sort((a, b) =>
      (b.postedAt ?? b.scheduledFor).localeCompare(a.postedAt ?? a.scheduledFor),
    )[0];
    const nextPlanned = [...plannedItems].sort((a, b) =>
      a.scheduledFor.localeCompare(b.scheduledFor),
    )[0];
    const coverage = Math.round((postedChannels.length / channels.length) * 100);
    const urgency =
      overdueItems.length * 4 +
      missingChannels.length +
      (property.status === "active" && postedItems.length === 0 ? 6 : 0);
    const health = property.status !== "active"
      ? "inactive"
      : overdueItems.length > 0 || postedItems.length === 0
        ? "urgent"
        : postedChannels.length >= 4
          ? "strong"
          : "progress";

    return {
      property,
      propertyItems,
      postedItems,
      plannedItems,
      postedChannels,
      missingChannels,
      overdueItems,
      linkedPosts,
      recentPosted,
      nextPlanned,
      coverage,
      urgency,
      health,
    };
  }), [items, now, properties]);

  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("th-TH");
    return reports
      .filter(({ property }) => {
        if (filter === "all") return true;
        if (filter === "hidden") return property.visible === false || property.status === "hidden";
        return (property.status ?? "active") === filter;
      })
      .filter(({ property }) =>
        !normalizedQuery ||
        `${property.title} ${property.location} ${property.type}`
          .toLocaleLowerCase("th-TH")
          .includes(normalizedQuery),
      )
      .sort((a, b) => b.urgency - a.urgency || a.property.title.localeCompare(b.property.title, "th"));
  }, [filter, query, reports]);

  const activeReports = reports.filter(({ property }) => (property.status ?? "active") === "active");
  const summary = {
    active: activeReports.length,
    started: activeReports.filter((report) => report.postedItems.length > 0).length,
    posted: activeReports.reduce((sum, report) => sum + report.postedItems.length, 0),
    linked: activeReports.reduce((sum, report) => sum + report.linkedPosts.length, 0),
    overdue: activeReports.reduce((sum, report) => sum + report.overdueItems.length, 0),
  };

  function exportCsv() {
    const header = [
      "ชื่อทรัพย์",
      "สถานะทรัพย์",
      "ทำเล",
      "จำนวนโพสต์แล้ว",
      "ช่องทางที่ลงแล้ว",
      "ความครอบคลุม (%)",
      "คิวที่วางแผน",
      "งานเลยกำหนด",
      "ลิงก์โพสต์จริง",
      "โพสต์ล่าสุด",
      "คิวถัดไป",
      "ช่องทางที่ยังขาด",
    ];
    const rows = visibleReports.map((report) => [
      report.property.title,
      statusLabels[report.property.status ?? "active"],
      report.property.location,
      report.postedItems.length,
      report.postedChannels.map((channel) => channelLabels[channel]).join(" | ") || "ยังไม่ได้โพสต์",
      report.coverage,
      report.plannedItems.length,
      report.overdueItems.length,
      report.linkedPosts.map((item) => item.postUrl ?? "").join(" | "),
      report.recentPosted?.postedAt ?? report.recentPosted?.scheduledFor ?? "",
      report.nextPlanned?.scheduledFor ?? "",
      report.missingChannels.map((channel) => channelLabels[channel]).join(" | "),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rich-asset-marketing-report-${generatedAt.slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="admin-report-summary" aria-label="ภาพรวมการตลาด">
        <article data-tone="blue"><Megaphone /><span><small>ทรัพย์พร้อมขาย</small><strong>{summary.active}</strong></span></article>
        <article data-tone="green"><CheckCircle2 /><span><small>เริ่มกระจายแล้ว</small><strong>{summary.started}/{summary.active}</strong></span></article>
        <article data-tone="blue"><BarChart3 /><span><small>โพสต์สำเร็จ</small><strong>{summary.posted}</strong></span></article>
        <article data-tone="green"><Link2 /><span><small>ลิงก์ที่บันทึก</small><strong>{summary.linked}</strong></span></article>
        <article data-tone="red"><TriangleAlert /><span><small>งานเลยกำหนด</small><strong>{summary.overdue}</strong></span></article>
      </section>

      <section className="admin-report-workspace">
        <div className="admin-report-toolbar">
          <div>
            <p className="section-kicker">อัปเดตอัตโนมัติจากคิวคอนเทนต์</p>
            <h2>ผลการกระจายประกาศรายทรัพย์</h2>
            <small>ข้อมูล ณ {formatDate(generatedAt)}</small>
          </div>
          <div className="admin-report-controls">
            <label>
              <Search />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อทรัพย์หรือทำเล"
                aria-label="ค้นหารายงานทรัพย์"
              />
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ReportFilter)}
              aria-label="กรองตามสถานะทรัพย์"
            >
              <option value="active">พร้อมขาย</option>
              <option value="reserved">ติดจอง</option>
              <option value="sold">ขายแล้ว</option>
              <option value="hidden">ปิดการแสดง</option>
              <option value="all">ทุกสถานะ</option>
            </select>
            <button type="button" onClick={exportCsv} disabled={visibleReports.length === 0}>
              <Download /> ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {visibleReports.length === 0 ? (
          <div className="admin-report-empty">
            <BarChart3 />
            <h3>ไม่พบทรัพย์ในมุมมองนี้</h3>
            <p>ลองเปลี่ยนสถานะหรือล้างคำค้นหา</p>
          </div>
        ) : (
          <div className="admin-report-list">
            {visibleReports.map((report) => (
              <article key={report.property.id} data-health={report.health}>
                <header>
                  <div>
                    <small>{report.property.type} · {report.property.location}</small>
                    <h3>{report.property.title}</h3>
                  </div>
                  <em>
                    {report.health === "urgent" && "ควรเร่งกระจาย"}
                    {report.health === "progress" && "กำลังกระจาย"}
                    {report.health === "strong" && "กระจายดี"}
                    {report.health === "inactive" && statusLabels[report.property.status ?? "active"]}
                  </em>
                </header>

                <div className="admin-report-progress-row">
                  <div>
                    <span><strong>{report.postedChannels.length}</strong> จาก {channels.length} ช่องทาง</span>
                    <small>{report.coverage}%</small>
                  </div>
                  <div className="admin-report-progress" aria-label={`ครอบคลุม ${report.coverage}%`}>
                    <span style={{ width: `${report.coverage}%` }} />
                  </div>
                </div>

                <div className="admin-report-channel-grid">
                  {channels.map((channel) => {
                    const complete = report.postedChannels.includes(channel);
                    return (
                      <span key={channel} data-complete={complete || undefined}>
                        {complete ? <CheckCircle2 /> : <span />}{channelLabels[channel]}
                      </span>
                    );
                  })}
                </div>

                <dl className="admin-report-facts">
                  <div><dt>โพสต์แล้ว</dt><dd>{report.postedItems.length}</dd></div>
                  <div><dt>วางแผนไว้</dt><dd>{report.plannedItems.length}</dd></div>
                  <div data-alert={report.overdueItems.length > 0 || undefined}><dt>เลยกำหนด</dt><dd>{report.overdueItems.length}</dd></div>
                  <div><dt>ลิงก์จริง</dt><dd>{report.linkedPosts.length}</dd></div>
                </dl>

                <div className="admin-report-dates">
                  <p><span>โพสต์ล่าสุด</span><strong>{formatDate(report.recentPosted?.postedAt ?? report.recentPosted?.scheduledFor ?? null)}</strong></p>
                  <p><span>คิวถัดไป</span><strong>{formatDate(report.nextPlanned?.scheduledFor ?? null)}</strong></p>
                </div>

                {report.linkedPosts.length > 0 && (
                  <div className="admin-report-links">
                    <p>ลิงก์ประกาศล่าสุด</p>
                    {report.linkedPosts.slice(0, 3).map((item) => (
                      <a href={item.postUrl!} target="_blank" rel="noreferrer" key={item.id}>
                        {channelLabels[item.channel]}{item.destination ? ` · ${item.destination}` : ""} <ExternalLink />
                      </a>
                    ))}
                  </div>
                )}

                {report.property.status === "active" && report.missingChannels.length > 0 && (
                  <p className="admin-report-action-note">
                    <TriangleAlert /> ช่องทางที่ควรเพิ่ม: {report.missingChannels.map((channel) => channelLabels[channel]).join(", ")}
                  </p>
                )}

                <footer>
                  <Link href={`/admin/content?property=${report.property.id}`}><FileText /> เปิดชุดโพสต์</Link>
                  <Link href={`/admin/schedule?property=${report.property.id}`}><CalendarClock /> วางแผนคิว</Link>
                  <Link href={`/properties/${report.property.id}`} target="_blank">ดูหน้าทรัพย์ <ExternalLink /></Link>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
