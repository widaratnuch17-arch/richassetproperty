"use client";

import {
  CalendarClock,
  Check,
  Clipboard,
  House,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ListingLead, ListingLeadStatus } from "../../db/listing-leads";

const statusLabels: Record<ListingLeadStatus, string> = {
  new: "ลูกค้าใหม่",
  contacted: "ติดต่อแล้ว",
  evaluating: "กำลังประเมิน",
  appointment: "นัดสำรวจ",
  won: "รับฝากขายแล้ว",
  closed: "ยังไม่ดำเนินการ",
};

type LeadFilter = "all" | "attention" | ListingLeadStatus;

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDatabaseDate(value: string) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}

function formatDate(value: string) {
  const date = parseDatabaseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFollowUp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function lineUrl(lineId: string) {
  return `https://line.me/ti/p/~${encodeURIComponent(lineId.trim().replace(/^@/, ""))}`;
}

function leadSummary(lead: ListingLead) {
  return [
    `ลูกค้าฝากขาย: ${lead.fullName}`,
    `โทร: ${lead.phone}`,
    lead.lineId ? `LINE: ${lead.lineId}` : "",
    `ทรัพย์: ${lead.propertyType}`,
    `ทำเล: ${lead.location}`,
    lead.askingPrice ? `ราคาที่ต้องการ: ${lead.askingPrice}` : "",
    lead.timeline ? `ช่วงเวลาที่ต้องการขาย: ${lead.timeline}` : "",
    lead.details ? `รายละเอียด: ${lead.details}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function LeadManager({
  initialLeads,
  initialFilter = "all",
}: {
  initialLeads: ListingLead[];
  initialFilter?: LeadFilter;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<LeadFilter>(initialFilter);
  const [editing, setEditing] = useState<ListingLead | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentTime] = useState(() => Date.now());
  const [today] = useState(bangkokToday);

  const counts = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      active: leads.filter((lead) =>
        ["contacted", "evaluating", "appointment"].includes(lead.status),
      ).length,
      won: leads.filter((lead) => lead.status === "won").length,
    }),
    [leads],
  );

  const visibleLeads = useMemo(
    () => {
      if (filter === "all") return leads;
      if (filter === "attention") {
        return leads.filter(
          (lead) =>
            !["won", "closed"].includes(lead.status) &&
            (lead.status === "new" ||
              Boolean(lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) <= today)),
        );
      }
      return leads.filter((lead) => lead.status === filter);
    },
    [filter, leads, today],
  );

  function startEdit(lead: ListingLead) {
    setEditing({ ...lead });
    setMessage("");
    setError("");
  }

  async function copyLead(lead: ListingLead) {
    try {
      await navigator.clipboard.writeText(leadSummary(lead));
      setCopiedId(lead.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("ไม่สามารถคัดลอกข้อมูลได้");
    }
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          status: editing.status,
          adminNotes: editing.adminNotes,
          nextFollowUp: editing.nextFollowUp,
        }),
      });
      const result = (await response.json()) as {
        lead?: ListingLead;
        error?: string;
      };
      if (!response.ok || !result.lead) {
        throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === result.lead!.id ? result.lead! : lead)),
      );
      setEditing(null);
      setMessage("บันทึกการติดตามลูกค้าเรียบร้อยแล้ว");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "บันทึกข้อมูลไม่สำเร็จ",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="admin-summary">
        <div><small>ลูกค้าทั้งหมด</small><strong>{counts.total}</strong></div>
        <div><small>ลูกค้าใหม่</small><strong>{counts.new}</strong></div>
        <div><small>กำลังติดตาม</small><strong>{counts.active}</strong></div>
        <div><small>รับฝากขายแล้ว</small><strong>{counts.won}</strong></div>
      </section>

      <section className="admin-toolbar admin-lead-toolbar">
        <div>
          <h2>รายชื่อลูกค้าจากเว็บไซต์</h2>
          <p>ติดต่อกลับ บันทึกสิ่งที่คุย และกำหนดวันติดตามครั้งต่อไป</p>
        </div>
        <label>
          แสดงสถานะ
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as LeadFilter)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="attention">ต้องติดตามตอนนี้</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
      </section>

      {message && <p className="admin-message"><Check /> {message}</p>}
      {error && <p className="admin-error">{error}</p>}

      <section className="admin-lead-list">
        {visibleLeads.length === 0 ? (
          <div className="admin-empty">
            <UserRound />
            <h2>ยังไม่มีลูกค้าในสถานะนี้</h2>
            <p>เมื่อมีคนส่งแบบฟอร์มฝากขาย ข้อมูลจะเข้ามาแสดงที่นี่อัตโนมัติ</p>
          </div>
        ) : (
          visibleLeads.map((lead) => {
            const isOverdue =
              Boolean(lead.nextFollowUp) &&
              new Date(lead.nextFollowUp!).getTime() < currentTime &&
              !["won", "closed"].includes(lead.status);

            return (
              <article className="admin-lead-card" key={lead.id}>
                <div className="admin-lead-card-head">
                  <div>
                    <span className="admin-status" data-status={lead.status}>
                      {statusLabels[lead.status]}
                    </span>
                    <h2>{lead.fullName}</h2>
                    <small>ส่งข้อมูลเมื่อ {formatDate(lead.createdAt)}</small>
                  </div>
                  <button type="button" onClick={() => startEdit(lead)}>
                    <Pencil /> อัปเดตการติดตาม
                  </button>
                </div>

                <div className="admin-lead-contact">
                  <a href={`tel:${lead.phone.replace(/\D/g, "")}`}>
                    <Phone /> {lead.phone}
                  </a>
                  {lead.lineId && (
                    <a href={lineUrl(lead.lineId)} target="_blank" rel="noreferrer">
                      <MessageCircle /> LINE {lead.lineId}
                    </a>
                  )}
                  <button type="button" onClick={() => copyLead(lead)}>
                    {copiedId === lead.id ? <Check /> : <Clipboard />}
                    {copiedId === lead.id ? "คัดลอกแล้ว" : "คัดลอกข้อมูล"}
                  </button>
                </div>

                <div className="admin-lead-details">
                  <p><House /><span><small>ประเภททรัพย์</small><strong>{lead.propertyType}</strong></span></p>
                  <p><MapPin /><span><small>ทำเล</small><strong>{lead.location}</strong></span></p>
                  <p><WalletCards /><span><small>ราคาที่ต้องการ</small><strong>{lead.askingPrice || "ไม่ได้ระบุ"}</strong></span></p>
                  <p><CalendarClock /><span><small>ต้องการขายภายใน</small><strong>{lead.timeline || "ไม่ได้ระบุ"}</strong></span></p>
                </div>

                {lead.details && (
                  <div className="admin-lead-note">
                    <small>ข้อมูลจากลูกค้า</small>
                    <p>{lead.details}</p>
                  </div>
                )}

                {(lead.adminNotes || lead.nextFollowUp) && (
                  <div className="admin-lead-follow-up" data-overdue={isOverdue || undefined}>
                    {lead.nextFollowUp && (
                      <p><CalendarClock /> ติดตามครั้งต่อไป: <strong>{formatFollowUp(lead.nextFollowUp)}</strong></p>
                    )}
                    {lead.adminNotes && <p>{lead.adminNotes}</p>}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {editing && (
        <div className="admin-editor-backdrop">
          <form className="admin-editor admin-lead-editor" onSubmit={saveLead}>
            <div className="admin-editor-head">
              <div>
                <p className="section-kicker">ติดตามลูกค้า</p>
                <h2>{editing.fullName}</h2>
                <p>{editing.propertyType} · {editing.location}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="ปิด">
                <X />
              </button>
            </div>

            <div className="admin-form-grid">
              <label>สถานะล่าสุด *
                <select
                  value={editing.status}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      status: event.target.value as ListingLeadStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>วันที่ติดตามครั้งต่อไป
                <input
                  type="datetime-local"
                  value={editing.nextFollowUp || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, nextFollowUp: event.target.value || null })
                  }
                />
              </label>
              <label className="admin-field-wide">บันทึกของนุช
                <textarea
                  rows={8}
                  value={editing.adminNotes || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, adminNotes: event.target.value })
                  }
                  placeholder="เช่น โทรแล้ว เจ้าของขอให้ประเมินราคาและนัดถ่ายรูปวันเสาร์"
                />
              </label>
            </div>

            <div className="admin-editor-actions">
              <button type="button" onClick={() => setEditing(null)}>ยกเลิก</button>
              <button type="submit" className="admin-primary" disabled={saving}>
                {saving ? <LoaderCircle className="spin" /> : <Save />}
                {saving ? "กำลังบันทึก" : "บันทึกการติดตาม"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
