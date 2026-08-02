"use client";

import {
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  ContentChannel,
  ContentScheduleItem,
  ContentType,
} from "../../db/content-schedule";
import type { Property } from "../data/properties";

const channelLabels: Record<ContentChannel, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  lemon8: "Lemon8",
  line_voom: "LINE VOOM",
  property_portal: "เว็บประกาศอสังหาฯ",
};

const contentTypeForChannel: Record<ContentChannel, ContentType> = {
  facebook: "facebook",
  tiktok: "shortCaption",
  youtube: "shortCaption",
  lemon8: "shortCaption",
  line_voom: "shortCaption",
  property_portal: "portal",
};

type ScheduleFilter = "attention" | "planned" | "posted" | "all";

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

function nextBangkokSlot() {
  const today = bangkokNowValue().slice(0, 10);
  const date = new Date(`${today}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  const nextDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return `${nextDay}T09:00`;
}

function formatScheduleDate(value: string) {
  const date = new Date(`${value}:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function responseError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "ไม่สามารถบันทึกได้ กรุณาลองใหม่";
}

export function ContentScheduleManager({
  properties,
  initialItems,
  initialPropertyId,
  initialChannel,
}: {
  properties: Property[];
  initialItems: ContentScheduleItem[];
  initialPropertyId?: string;
  initialChannel?: ContentChannel;
}) {
  const activeProperties = properties.filter((property) => property.status === "active");
  const firstProperty =
    activeProperties.find((property) => property.id === initialPropertyId) ??
    activeProperties[0];
  const [items, setItems] = useState(initialItems);
  const [propertyId, setPropertyId] = useState(firstProperty?.id ?? "");
  const [channel, setChannel] = useState<ContentChannel>(
    initialChannel && initialChannel in channelLabels ? initialChannel : "facebook",
  );
  const [destination, setDestination] = useState("");
  const [scheduledFor, setScheduledFor] = useState(nextBangkokSlot);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<ScheduleFilter>("attention");
  const [postingId, setPostingId] = useState<number | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const now = bangkokNowValue();
  const today = now.slice(0, 10);

  const propertyById = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  );
  const summary = useMemo(() => {
    const planned = items.filter((item) => item.status === "planned");
    return {
      overdue: planned.filter((item) => item.scheduledFor < now).length,
      today: planned.filter((item) => item.scheduledFor.slice(0, 10) === today).length,
      upcoming: planned.filter((item) => item.scheduledFor.slice(0, 10) > today).length,
      posted: items.filter((item) => item.status === "posted").length,
    };
  }, [items, now, today]);
  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === "attention") {
        return item.status === "planned" && item.scheduledFor.slice(0, 10) <= today;
      }
      if (filter === "planned") return item.status === "planned";
      if (filter === "posted") return item.status === "posted";
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (a.status !== b.status) return a.status === "planned" ? -1 : 1;
      return a.status === "planned"
        ? a.scheduledFor.localeCompare(b.scheduledFor)
        : b.scheduledFor.localeCompare(a.scheduledFor);
    });
  }, [filter, items, today]);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content-schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          propertyId,
          channel,
          contentType: contentTypeForChannel[channel],
          destination,
          scheduledFor,
          notes,
        }),
      });
      const payload = (await response.json()) as { item?: ContentScheduleItem; error?: string };
      if (!response.ok || !payload.item) throw new Error(responseError(payload));
      setItems((current) => [...current, payload.item!]);
      setDestination("");
      setNotes("");
      setScheduledFor(nextBangkokSlot());
      setFilter("planned");
      setMessage("เพิ่มเข้าคิวโพสต์แล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ไม่สามารถเพิ่มคิวได้");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(
    itemId: number,
    values: Record<string, unknown>,
    successMessage: string,
  ) {
    clearFeedback();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content-schedule", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: itemId, ...values }),
      });
      const payload = (await response.json()) as { item?: ContentScheduleItem; error?: string };
      if (!response.ok || !payload.item) throw new Error(responseError(payload));
      setItems((current) =>
        current.map((item) => (item.id === payload.item!.id ? payload.item! : item)),
      );
      setPostingId(null);
      setRescheduleId(null);
      setPostUrl("");
      setMessage(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ไม่สามารถอัปเดตได้");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(itemId: number) {
    if (deleteId !== itemId) {
      setDeleteId(itemId);
      return;
    }
    clearFeedback();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content-schedule", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(responseError(payload));
      setItems((current) => current.filter((item) => item.id !== itemId));
      setDeleteId(null);
      setMessage("ลบรายการแล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ไม่สามารถลบได้");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="admin-schedule-summary" aria-label="สรุปคิวคอนเทนต์">
        <button type="button" data-tone="red" onClick={() => setFilter("attention")}>
          <Clock3 /><span><small>เลยกำหนด</small><strong>{summary.overdue}</strong></span>
        </button>
        <button type="button" data-tone="amber" onClick={() => setFilter("attention")}>
          <CalendarClock /><span><small>ต้องโพสต์วันนี้</small><strong>{summary.today}</strong></span>
        </button>
        <button type="button" data-tone="blue" onClick={() => setFilter("planned")}>
          <CalendarPlus /><span><small>คิวถัดไป</small><strong>{summary.upcoming}</strong></span>
        </button>
        <button type="button" data-tone="green" onClick={() => setFilter("posted")}>
          <CheckCircle2 /><span><small>โพสต์แล้ว</small><strong>{summary.posted}</strong></span>
        </button>
      </section>

      <section className="admin-schedule-layout">
        <form className="admin-schedule-form" onSubmit={createItem}>
          <div className="admin-panel-head">
            <div>
              <p className="section-kicker">วางแผนงานใหม่</p>
              <h2>เพิ่มเข้าคิวโพสต์</h2>
            </div>
            <CalendarPlus />
          </div>
          <label>
            ทรัพย์
            <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} required>
              {activeProperties.map((property) => (
                <option value={property.id} key={property.id}>{property.title}</option>
              ))}
            </select>
          </label>
          <label>
            ช่องทาง
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as ContentChannel)}
            >
              {Object.entries(channelLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            ชื่อเว็บ กลุ่ม หรือปลายทาง <small>(ถ้ามี)</small>
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              maxLength={150}
              placeholder="เช่น LivingInsider หรือกลุ่มบ้านมือสอง"
            />
          </label>
          <label>
            วันและเวลาที่จะโพสต์
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              required
            />
          </label>
          <label>
            หมายเหตุ <small>(ถ้ามี)</small>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              placeholder="เช่น ใช้ภาพหน้าบ้านเป็นภาพแรก"
            />
          </label>
          <button className="admin-primary-button" type="submit" disabled={saving || !firstProperty}>
            <CalendarPlus /> {saving ? "กำลังบันทึก..." : "เพิ่มเข้าคิว"}
          </button>
          {!firstProperty && <p className="admin-form-error">ยังไม่มีทรัพย์พร้อมขายสำหรับวางแผนโพสต์</p>}
        </form>

        <div className="admin-schedule-board">
          <div className="admin-schedule-toolbar">
            <div>
              <p className="section-kicker">แผนกระจายประกาศ</p>
              <h2>คิวคอนเทนต์</h2>
            </div>
            <div role="group" aria-label="กรองคิวคอนเทนต์">
              {([
                ["attention", "ต้องทำ"],
                ["planned", "วางแผนไว้"],
                ["posted", "โพสต์แล้ว"],
                ["all", "ทั้งหมด"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(message || error) && (
            <p className={error ? "admin-form-error" : "admin-form-success"} aria-live="polite">
              {error || message}
            </p>
          )}

          {visibleItems.length === 0 ? (
            <div className="admin-schedule-empty">
              <CheckCircle2 />
              <h3>{filter === "attention" ? "ไม่มีคิวที่ต้องรีบทำ" : "ยังไม่มีรายการในมุมมองนี้"}</h3>
              <p>เพิ่มแผนจากแบบฟอร์มด้านซ้าย หรือเปิดชุดโพสต์เพื่อเตรียมข้อความ</p>
            </div>
          ) : (
            <div className="admin-schedule-list">
              {visibleItems.map((item) => {
                const property = propertyById.get(item.propertyId);
                const isOverdue = item.status === "planned" && item.scheduledFor < now;
                const isToday = item.scheduledFor.slice(0, 10) === today;
                return (
                  <article key={item.id} data-status={item.status} data-overdue={isOverdue || undefined}>
                    <header>
                      <span data-channel={item.channel}>{channelLabels[item.channel].slice(0, 1)}</span>
                      <div>
                        <small>{channelLabels[item.channel]}{item.destination ? ` · ${item.destination}` : ""}</small>
                        <h3>{property?.title ?? item.propertyId}</h3>
                      </div>
                      <em>{item.status === "posted" ? "โพสต์แล้ว" : isOverdue ? "เลยกำหนด" : isToday ? "วันนี้" : "วางแผนไว้"}</em>
                    </header>
                    <p className="admin-schedule-time"><Clock3 /> {formatScheduleDate(item.scheduledFor)}</p>
                    {item.notes && <p className="admin-schedule-notes">{item.notes}</p>}
                    {item.postUrl && (
                      <a className="admin-schedule-post-link" href={item.postUrl} target="_blank" rel="noreferrer">
                        <Link2 /> เปิดโพสต์จริง <ExternalLink />
                      </a>
                    )}

                    {postingId === item.id && (
                      <div className="admin-schedule-inline-form">
                        <label>
                          ลิงก์โพสต์จริง <small>(ไม่ใส่ก็ได้)</small>
                          <input
                            type="url"
                            value={postUrl}
                            onChange={(event) => setPostUrl(event.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => updateItem(item.id, { status: "posted", postUrl }, "บันทึกว่าโพสต์แล้ว")}
                        >
                          <Check /> ยืนยัน
                        </button>
                        <button type="button" onClick={() => setPostingId(null)}><X /> ยกเลิก</button>
                      </div>
                    )}

                    {rescheduleId === item.id && (
                      <div className="admin-schedule-inline-form">
                        <label>
                          วันและเวลาใหม่
                          <input
                            type="datetime-local"
                            value={rescheduleValue}
                            onChange={(event) => setRescheduleValue(event.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={saving || !rescheduleValue}
                          onClick={() => updateItem(item.id, { scheduledFor: rescheduleValue }, "เลื่อนคิวเรียบร้อยแล้ว")}
                        >
                          <Check /> บันทึก
                        </button>
                        <button type="button" onClick={() => setRescheduleId(null)}><X /> ยกเลิก</button>
                      </div>
                    )}

                    <footer>
                      <Link href={`/admin/content?property=${item.propertyId}`}>
                        <FileText /> เปิดชุดโพสต์
                      </Link>
                      {item.status === "planned" ? (
                        <>
                          <button type="button" onClick={() => { setPostingId(item.id); setPostUrl(item.postUrl ?? ""); }}>
                            <CheckCircle2 /> โพสต์แล้ว
                          </button>
                          <button type="button" onClick={() => { setRescheduleId(item.id); setRescheduleValue(item.scheduledFor); }}>
                            <CalendarClock /> เลื่อนวัน
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => updateItem(item.id, { status: "planned" }, "ย้ายกลับเข้าคิวแล้ว")}
                        >
                          <RotateCcw /> กลับเข้าคิว
                        </button>
                      )}
                      <button
                        type="button"
                        data-danger={deleteId === item.id || undefined}
                        disabled={saving}
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 /> {deleteId === item.id ? "ยืนยันลบ" : "ลบ"}
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
