"use client";

import {
  BedDouble,
  CalendarClock,
  Check,
  Clipboard,
  HandCoins,
  House,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { BuyerRequest, BuyerRequestStatus } from "../../db/buyer-requests";

const statusLabels: Record<BuyerRequestStatus, string> = {
  new: "ผู้ซื้อใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "พร้อมซื้อจริง",
  appointment: "นัดชม",
  offer: "ยื่นข้อเสนอ",
  won: "ปิดการขาย",
  closed: "พัก/ไม่ดำเนินการ",
};

type BuyerFilter = "all" | "attention" | BuyerRequestStatus;

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDatabaseDate(value: string) {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

function formatDate(value: string) {
  const date = parseDatabaseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatFollowUp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function lineUrl(lineId: string) {
  return `https://line.me/ti/p/~${encodeURIComponent(lineId.trim().replace(/^@/, ""))}`;
}

function money(value: number | null) {
  return value === null ? "ยังไม่ระบุ" : `${new Intl.NumberFormat("th-TH").format(value)} บาท`;
}

function numberOrNull(value: string) {
  if (!value) return null;
  const result = Number(value);
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}

function buyerSummary(buyer: BuyerRequest) {
  return [
    `ผู้ซื้อ: ${buyer.fullName}`,
    `โทร: ${buyer.phone}`,
    buyer.lineId ? `LINE: ${buyer.lineId}` : "",
    `มองหา: ${buyer.propertyType}`,
    `ทำเล: ${buyer.preferredLocations}`,
    `งบประมาณ: ${buyer.budgetRange}`,
    buyer.bedrooms ? `ห้องนอน: ${buyer.bedrooms} ห้อง` : "",
    `ต้องการซื้อ: ${buyer.timeline}`,
    `สินเชื่อ: ${buyer.financing}`,
    buyer.details ? `รายละเอียด: ${buyer.details}` : "",
  ].filter(Boolean).join("\n");
}

export function BuyerRequestManager({
  initialBuyerRequests,
  initialFilter = "all",
}: {
  initialBuyerRequests: BuyerRequest[];
  initialFilter?: BuyerFilter;
}) {
  const [buyers, setBuyers] = useState(initialBuyerRequests);
  const [filter, setFilter] = useState<BuyerFilter>(initialFilter);
  const [editing, setEditing] = useState<BuyerRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentTime] = useState(() => Date.now());
  const [today] = useState(bangkokToday);

  const counts = useMemo(() => ({
    total: buyers.length,
    new: buyers.filter((buyer) => buyer.status === "new").length,
    serious: buyers.filter((buyer) => ["qualified", "appointment", "offer"].includes(buyer.status)).length,
    won: buyers.filter((buyer) => buyer.status === "won").length,
  }), [buyers]);

  const visibleBuyers = useMemo(() => {
    if (filter === "all") return buyers;
    if (filter === "attention") {
      return buyers.filter((buyer) =>
        !["won", "closed"].includes(buyer.status) &&
        (buyer.status === "new" || Boolean(buyer.nextFollowUp && buyer.nextFollowUp.slice(0, 10) <= today)),
      );
    }
    return buyers.filter((buyer) => buyer.status === filter);
  }, [buyers, filter, today]);

  async function copyBuyer(buyer: BuyerRequest) {
    try {
      await navigator.clipboard.writeText(buyerSummary(buyer));
      setCopiedId(buyer.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("ไม่สามารถคัดลอกข้อมูลได้");
    }
  }

  async function saveBuyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/buyer-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const result = (await response.json()) as { buyerRequest?: BuyerRequest; error?: string };
      if (!response.ok || !result.buyerRequest) throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      setBuyers((current) => current.map((buyer) => buyer.id === result.buyerRequest!.id ? result.buyerRequest! : buyer));
      setEditing(null);
      setMessage("บันทึกการติดตามผู้ซื้อเรียบร้อยแล้ว");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="admin-summary">
        <div><small>ผู้ซื้อทั้งหมด</small><strong>{counts.total}</strong></div>
        <div><small>ผู้ซื้อใหม่</small><strong>{counts.new}</strong></div>
        <div><small>ผู้สนใจจริง</small><strong>{counts.serious}</strong></div>
        <div><small>ปิดการขาย</small><strong>{counts.won}</strong></div>
      </section>

      <section className="admin-toolbar admin-lead-toolbar">
        <div><h2>ความต้องการซื้อจากเว็บไซต์</h2><p>คัดกรองงบ ทำเล ความพร้อมด้านสินเชื่อ และกำหนดวันติดตาม</p></div>
        <label>แสดงสถานะ
          <select value={filter} onChange={(event) => setFilter(event.target.value as BuyerFilter)}>
            <option value="all">ทั้งหมด</option><option value="attention">ต้องติดตามตอนนี้</option>
            {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </section>

      {message && <p className="admin-message"><Check /> {message}</p>}
      {error && <p className="admin-error">{error}</p>}

      <section className="admin-lead-list">
        {visibleBuyers.length === 0 ? (
          <div className="admin-empty"><Search /><h2>ยังไม่มีผู้ซื้อในสถานะนี้</h2><p>เมื่อมีคนฝากความต้องการซื้อ ข้อมูลจะเข้ามาแสดงที่นี่อัตโนมัติ</p></div>
        ) : visibleBuyers.map((buyer) => {
          const isOverdue = Boolean(buyer.nextFollowUp) && new Date(buyer.nextFollowUp!).getTime() < currentTime && !["won", "closed"].includes(buyer.status);
          return (
            <article className="admin-lead-card" key={buyer.id}>
              <div className="admin-lead-card-head">
                <div><span className="admin-status" data-status={buyer.status}>{statusLabels[buyer.status]}</span><h2>{buyer.fullName}</h2><small>ส่งข้อมูลเมื่อ {formatDate(buyer.createdAt)} · {buyer.source}</small></div>
                <button type="button" onClick={() => { setEditing({ ...buyer }); setMessage(""); setError(""); }}><Pencil /> อัปเดตการติดตาม</button>
              </div>

              <div className="admin-lead-contact">
                <a href={`tel:${buyer.phone.replace(/\D/g, "")}`}><Phone /> {buyer.phone}</a>
                {buyer.lineId && <a href={lineUrl(buyer.lineId)} target="_blank" rel="noreferrer"><MessageCircle /> LINE {buyer.lineId}</a>}
                <button type="button" onClick={() => copyBuyer(buyer)}>{copiedId === buyer.id ? <Check /> : <Clipboard />}{copiedId === buyer.id ? "คัดลอกแล้ว" : "คัดลอกข้อมูล"}</button>
              </div>

              <div className="admin-lead-details">
                <p><House /><span><small>ประเภททรัพย์</small><strong>{buyer.propertyType}</strong></span></p>
                <p><MapPin /><span><small>ทำเล</small><strong>{buyer.preferredLocations}</strong></span></p>
                <p><WalletCards /><span><small>งบประมาณ</small><strong>{buyer.budgetRange}</strong></span></p>
                <p><BedDouble /><span><small>ห้องนอน</small><strong>{buyer.bedrooms ? `${buyer.bedrooms} ห้อง` : "ไม่ได้ระบุ"}</strong></span></p>
                <p><CalendarClock /><span><small>ต้องการซื้อ</small><strong>{buyer.timeline}</strong></span></p>
                <p><HandCoins /><span><small>ความพร้อม</small><strong>{buyer.financing}</strong></span></p>
              </div>

              {buyer.details && <div className="admin-lead-note"><small>ข้อมูลจากผู้ซื้อ</small><p>{buyer.details}</p></div>}
              {(buyer.adminNotes || buyer.nextFollowUp || buyer.appointmentAt || buyer.offerAmount !== null) && (
                <div className="admin-lead-follow-up" data-overdue={isOverdue || undefined}>
                  {buyer.nextFollowUp && <p><CalendarClock /> ติดตามครั้งต่อไป: <strong>{formatFollowUp(buyer.nextFollowUp)}</strong></p>}
                  {buyer.appointmentAt && <p><CalendarClock /> นัดหมาย: <strong>{formatFollowUp(buyer.appointmentAt)}</strong></p>}
                  {buyer.offerAmount !== null && <p>ข้อเสนอ: <strong>{money(buyer.offerAmount)}</strong></p>}
                  {buyer.adminNotes && <p>{buyer.adminNotes}</p>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {editing && (
        <div className="admin-editor-backdrop">
          <form className="admin-editor admin-lead-editor" onSubmit={saveBuyer}>
            <div className="admin-editor-head">
              <div><p className="section-kicker">ติดตามผู้ซื้อ</p><h2>{editing.fullName}</h2><p>{editing.propertyType} · {editing.preferredLocations}</p></div>
              <button type="button" onClick={() => setEditing(null)} aria-label="ปิด"><X /></button>
            </div>
            <div className="admin-form-grid">
              <label>สถานะล่าสุด *<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as BuyerRequestStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>วันที่ติดตามครั้งต่อไป<input type="datetime-local" value={editing.nextFollowUp || ""} onChange={(event) => setEditing({ ...editing, nextFollowUp: event.target.value || null })} /></label>
              <label>วันนัดชม<input type="datetime-local" value={editing.appointmentAt || ""} onChange={(event) => setEditing({ ...editing, appointmentAt: event.target.value || null })} /></label>
              <label>วันที่ปิดดีล<input type="date" value={editing.closedAt?.slice(0, 10) || ""} onChange={(event) => setEditing({ ...editing, closedAt: event.target.value || null })} /></label>
              <label>ยอดเสนอซื้อ (บาท)<input type="number" min="0" step="1" value={editing.offerAmount ?? ""} onChange={(event) => setEditing({ ...editing, offerAmount: numberOrNull(event.target.value) })} /></label>
              <label>มูลค่าขายอสังหาฯ (บาท)<input type="number" min="0" step="1" value={editing.salePrice ?? ""} onChange={(event) => setEditing({ ...editing, salePrice: numberOrNull(event.target.value) })} /></label>
              <label>รายได้ค่าคอมมิชชัน (บาท)<input type="number" min="0" step="1" value={editing.commissionIncome ?? ""} onChange={(event) => setEditing({ ...editing, commissionIncome: numberOrNull(event.target.value) })} /></label>
              <label>ค่าใช้จ่ายดีล (บาท)<input type="number" min="0" step="1" value={editing.dealExpenses} onChange={(event) => setEditing({ ...editing, dealExpenses: numberOrNull(event.target.value) ?? 0 })} /></label>
              <label className="admin-field-wide">บันทึกของนุช<textarea rows={7} value={editing.adminNotes || ""} onChange={(event) => setEditing({ ...editing, adminNotes: event.target.value })} placeholder="เช่น ต้องเช็กวงเงินก่อน ส่งตัวเลือก 3 หลัง และติดตามผลหลังนัดชม" /></label>
            </div>
            <div className="admin-editor-actions"><button type="button" onClick={() => setEditing(null)}>ยกเลิก</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? "กำลังบันทึก" : "บันทึกการติดตาม"}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
