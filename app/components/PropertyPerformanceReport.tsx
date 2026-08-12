"use client";

import {
  BarChart3, CalendarCheck, Check, Clipboard, ExternalLink, Eye, MessageCircle,
  MousePointerClick, Phone, Save, Send, Sparkles, Target, UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { PropertyInquiry, PropertyInquiryStatus, PropertyPerformanceEvent } from "../../db/property-analytics";
import type { Property } from "../data/properties";

const sourceLabels: Record<string, string> = {
  direct: "เข้าตรง / ไม่ระบุ", facebook: "Facebook", tiktok: "TikTok",
  youtube: "YouTube", lemon8: "Lemon8", line_voom: "LINE VOOM",
  property_portal: "เว็บประกาศอสังหาฯ",
};

const statusLabels: Record<PropertyInquiryStatus, string> = {
  new: "ลีดใหม่", contacted: "ติดต่อแล้ว", qualified: "ผู้สนใจจริง",
  appointment: "นัดชม", offer: "ยื่นข้อเสนอ", won: "ปิดการขาย", closed: "ปิดลีด",
};

const statusOptions = Object.entries(statusLabels) as [PropertyInquiryStatus, string][];
const channels = [
  ["facebook", "Facebook", "social"], ["tiktok", "TikTok", "social"],
  ["youtube", "YouTube", "video"], ["lemon8", "Lemon8", "social"],
  ["line_voom", "LINE VOOM", "social"], ["property_portal", "เว็บประกาศอสังหาฯ", "referral"],
] as const;

type MutableInquiry = PropertyInquiry & { saving?: boolean; saved?: boolean; error?: string };

function inputMoney(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value);
}

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) + "%" : "—";
}

function formatDate(value: string | null) {
  if (!value) return "ยังไม่กำหนด";
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short",
  }).format(date);
}

function sourceName(source: string) {
  return sourceLabels[source] ?? source;
}

export function PropertyPerformanceReport({
  properties, initialEvents, initialInquiries, days,
}: {
  properties: Property[];
  initialEvents: PropertyPerformanceEvent[];
  initialInquiries: PropertyInquiry[];
  days: number;
}) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<MutableInquiry[]>(initialInquiries);
  const [linkProperty, setLinkProperty] = useState(properties.find((item) => item.status === "active")?.id ?? properties[0]?.id ?? "");
  const [linkSource, setLinkSource] = useState("facebook");
  const [copied, setCopied] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [addError, setAddError] = useState("");

  const report = useMemo(() => {
    const propertyRows = properties.map((property) => {
      const events = initialEvents.filter((event) => event.propertyId === property.id);
      const leads = inquiries.filter((inquiry) => inquiry.propertyId === property.id);
      const views = events.filter((event) => event.eventType === "view").length;
      const phone = events.filter((event) => event.eventType === "phone_click").length;
      const line = events.filter((event) => event.eventType === "line_click").length;
      const shares = events.filter((event) => event.eventType === "share_click").length;
      return { property, views, phone, line, shares, contacts: phone + line, leads: leads.length };
    }).sort((a, b) => b.leads - a.leads || b.contacts - a.contacts || b.views - a.views);

    const sourceKeys = [...new Set([
      ...initialEvents.map((event) => event.source),
      ...inquiries.map((inquiry) => inquiry.source),
    ])];
    const sourceRows = sourceKeys.map((source) => {
      const events = initialEvents.filter((event) => event.source === source);
      const leads = inquiries.filter((inquiry) => inquiry.source === source);
      const views = events.filter((event) => event.eventType === "view").length;
      const contacts = events.filter((event) => ["phone_click", "line_click"].includes(event.eventType)).length;
      return { source, views, contacts, leads: leads.length };
    }).sort((a, b) => b.leads - a.leads || b.contacts - a.contacts || b.views - a.views);

    const views = initialEvents.filter((event) => event.eventType === "view").length;
    const phone = initialEvents.filter((event) => event.eventType === "phone_click").length;
    const line = initialEvents.filter((event) => event.eventType === "line_click").length;
    const serious = inquiries.filter((item) => ["qualified", "appointment", "offer", "won"].includes(item.status)).length;
    const appointments = inquiries.filter((item) => item.status === "appointment").length;
    const offers = inquiries.filter((item) => item.status === "offer").length;
    const won = inquiries.filter((item) => item.status === "won").length;
    return { propertyRows, sourceRows, views, contacts: phone + line, leads: inquiries.length, serious, appointments, offers, won };
  }, [initialEvents, inquiries, properties]);

  const trackingUrl = useMemo(() => {
    const channel = channels.find(([value]) => value === linkSource) ?? channels[0];
    const params = new URLSearchParams({
      utm_source: channel[0], utm_medium: channel[2], utm_campaign: linkProperty,
    });
    return "/properties/" + linkProperty + "?" + params.toString();
  }, [linkProperty, linkSource]);

  async function copyTrackingLink() {
    await navigator.clipboard.writeText(window.location.origin + trackingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function updateInquiry(id: number, values: Partial<MutableInquiry>) {
    setInquiries((current) => current.map((item) => item.id === id ? { ...item, ...values, saved: false, error: "" } : item));
  }

  async function saveInquiry(item: MutableInquiry) {
    updateInquiry(item.id, { saving: true });
    try {
      const response = await fetch("/api/admin/property-inquiries", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id, status: item.status, adminNotes: item.adminNotes, nextFollowUp: item.nextFollowUp,
          appointmentAt: item.appointmentAt, offerAmount: item.offerAmount, salePrice: item.salePrice,
          commissionIncome: item.commissionIncome, dealExpenses: item.dealExpenses, closedAt: item.closedAt,
        }),
      });
      const result = (await response.json()) as { inquiry?: PropertyInquiry; error?: string };
      if (!response.ok || !result.inquiry) throw new Error(result.error || "บันทึกไม่สำเร็จ");
      setInquiries((current) => current.map((row) => row.id === item.id ? { ...result.inquiry!, saving: false, saved: true } : row));
    } catch (error) {
      updateInquiry(item.id, { saving: false, error: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" });
    }
  }

  async function addManualLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAddingLead(true); setAddError("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const response = await fetch("/api/admin/property-inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const result = (await response.json()) as { inquiry?: PropertyInquiry; error?: string };
      if (!response.ok || !result.inquiry) throw new Error(result.error || "เพิ่มลีดไม่สำเร็จ");
      setInquiries((current) => [result.inquiry!, ...current]); form.reset();
    } catch (error) { setAddError(error instanceof Error ? error.message : "เพิ่มลีดไม่สำเร็จ"); }
    finally { setAddingLead(false); }
  }

  return (
    <section className="performance-report" id="performance">
      <div className="performance-heading">
        <div><p className="section-kicker">วัดผลจากลูกค้าจริง</p><h2>ทรัพย์และช่องทางที่สร้างโอกาสขาย</h2><p>ยอดเข้าชมเป็นความสนใจเบื้องต้น ส่วน “ลีด” จะนับเมื่อผู้สนใจส่งชื่อและเบอร์โทรแล้วเท่านั้น</p></div>
        <label>ช่วงรายงาน<select value={days} onChange={(event) => router.push("/admin/reports?days=" + event.target.value + "#performance")}><option value={7}>7 วันล่าสุด</option><option value={30}>30 วันล่าสุด</option><option value={90}>90 วันล่าสุด</option><option value={0}>ทั้งหมด</option></select></label>
      </div>

      <div className="performance-kpis">
        <article><Eye /><span><small>ยอดเข้าชม</small><strong>{report.views}</strong></span></article>
        <article><MousePointerClick /><span><small>คลิกโทร + LINE</small><strong>{report.contacts}</strong></span></article>
        <article><Send /><span><small>ลีดผู้ซื้อจริง</small><strong>{report.leads}</strong></span></article>
        <article><UserCheck /><span><small>ผู้สนใจจริง</small><strong>{report.serious}</strong></span></article>
        <article><CalendarCheck /><span><small>นัดชม</small><strong>{report.appointments}</strong></span></article>
        <article><Target /><span><small>ข้อเสนอ / ปิดได้</small><strong>{report.offers} / {report.won}</strong></span></article>
      </div>

      <div className="performance-funnel">
        <div><span>ดูหน้าทรัพย์</span><strong>{report.views}</strong></div><b>→ <small>{percent(report.contacts, report.views)}</small></b>
        <div><span>คลิกติดต่อ</span><strong>{report.contacts}</strong></div><b>→ <small>{percent(report.leads, report.contacts)}</small></b>
        <div><span>ส่งข้อมูล</span><strong>{report.leads}</strong></div><b>→ <small>{percent(report.serious, report.leads)}</small></b>
        <div><span>ผู้สนใจจริง</span><strong>{report.serious}</strong></div>
      </div>

      {report.views === 0 && report.leads === 0 && <div className="performance-empty"><Sparkles /><div><strong>ระบบพร้อมเริ่มเก็บข้อมูลแล้ว</strong><p>ตัวเลขจะเริ่มนับหลังเผยแพร่เวอร์ชันนี้ และจะไม่สร้างข้อมูลย้อนหลังขึ้นมาเอง</p></div></div>}

      <div className="performance-grid">
        <article className="performance-panel">
          <header><BarChart3 /><div><small>เรียงจากโอกาสมากที่สุด</small><h3>ผลลัพธ์รายทรัพย์</h3></div></header>
          <div className="performance-table-wrap"><table><thead><tr><th>ทรัพย์</th><th>ดู</th><th>โทร</th><th>LINE</th><th>แชร์</th><th>ลีด</th><th>ดู → ลีด</th></tr></thead>
            <tbody>{report.propertyRows.map((row) => <tr key={row.property.id}><td><a href={"/properties/" + row.property.id} target="_blank">{row.property.title} <ExternalLink /></a></td><td>{row.views}</td><td>{row.phone}</td><td>{row.line}</td><td>{row.shares}</td><td><strong>{row.leads}</strong></td><td>{percent(row.leads, row.views)}</td></tr>)}</tbody>
          </table></div>
        </article>
        <article className="performance-panel">
          <header><Target /><div><small>เทียบคุณภาพแหล่งที่มา</small><h3>ผลลัพธ์รายช่องทาง</h3></div></header>
          <div className="performance-table-wrap"><table><thead><tr><th>ช่องทาง</th><th>ดู</th><th>คลิก</th><th>ลีด</th><th>ดู → ลีด</th></tr></thead>
            <tbody>{report.sourceRows.length > 0 ? report.sourceRows.map((row) => <tr key={row.source}><td>{sourceName(row.source)}</td><td>{row.views}</td><td>{row.contacts}</td><td><strong>{row.leads}</strong></td><td>{percent(row.leads, row.views)}</td></tr>) : <tr><td colSpan={5}>ยังไม่มีข้อมูลช่องทาง</td></tr>}</tbody>
          </table></div>
        </article>
      </div>

      <article className="tracking-link-builder">
        <header><Clipboard /><div><small>ส่งให้ Marketing ใช้ทุกโพสต์</small><h3>สร้างลิงก์แยกช่องทาง</h3></div></header>
        <div className="tracking-link-controls">
          <label>ทรัพย์<select value={linkProperty} onChange={(event) => setLinkProperty(event.target.value)}>{properties.map((property) => <option value={property.id} key={property.id}>{property.title}</option>)}</select></label>
          <label>ช่องทาง<select value={linkSource} onChange={(event) => setLinkSource(event.target.value)}>{channels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <div><code>{trackingUrl}</code><button type="button" onClick={copyTrackingLink}>{copied ? <Check /> : <Clipboard />}{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</button></div>
        </div>
        <p>ใช้ลิงก์ที่สร้างแทนลิงก์หน้าทรัพย์ปกติ ระบบจึงบอกได้ว่าลูกค้ามาจากโพสต์ช่องทางใด</p>
      </article>

      <article className="inquiry-pipeline" id="buyer-pipeline">
        <header><MessageCircle /><div><small>นุชอัปเดตหลังคุยกับลูกค้า</small><h3>ลีดผู้ซื้อและขั้นตอนติดตาม</h3></div></header>
        <form className="manual-buyer-lead" onSubmit={addManualLead}>
          <div><strong>บันทึกลีดที่โทรหรือทัก LINE มาเอง</strong><small>ใช้เมื่อผู้สนใจไม่ได้กรอกแบบฟอร์มหน้าเว็บไซต์</small></div>
          <label>ทรัพย์<select name="propertyId" required defaultValue=""><option value="" disabled>เลือกทรัพย์</option>{properties.map((property) => <option value={property.id} key={property.id}>{property.title}</option>)}</select></label>
          <label>ชื่อ<input name="fullName" required maxLength={100} /></label>
          <label>เบอร์โทร<input name="phone" type="tel" required maxLength={30} /></label>
          <label>LINE ID<input name="lineId" maxLength={100} /></label>
          <label>ช่องทาง<select name="source" defaultValue="manual"><option value="manual">ไม่ระบุ</option>{channels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="manual-lead-message">รายละเอียด<input name="message" maxLength={600} placeholder="เช่น โทรจากป้ายหน้าทรัพย์ ต้องการนัดชม" /></label>
          <button type="submit" disabled={addingLead}><Send /> {addingLead ? "กำลังเพิ่ม" : "เพิ่มลีดผู้ซื้อ"}</button>
          {addError && <small className="inquiry-error">{addError}</small>}
        </form>
        {inquiries.length === 0 ? <div className="inquiry-empty">ยังไม่มีผู้สนใจส่งแบบฟอร์มนัดชมในช่วงนี้</div> : <div className="inquiry-list">{inquiries.map((item) => {
          const property = properties.find((row) => row.id === item.propertyId);
          return <section key={item.id}>
            <div className="inquiry-contact"><small>{sourceName(item.source)} · {formatDate(item.createdAt)}</small><h4>{item.fullName}</h4><p>{property?.title ?? item.propertyId}</p>{item.message && <blockquote>{item.message}</blockquote>}
              <div><a href={"tel:" + item.phone.replace(/\D/g, "")}><Phone /> {item.phone}</a>{item.lineId && <a href={"https://line.me/ti/p/~" + encodeURIComponent(item.lineId.replace(/^@/, ""))} target="_blank"><MessageCircle /> LINE</a>}</div>
            </div>
            <div className="inquiry-fields">
              <label>สถานะ<select value={item.status} onChange={(event) => updateInquiry(item.id, { status: event.target.value as PropertyInquiryStatus })}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>ติดตามครั้งถัดไป<input type="datetime-local" value={item.nextFollowUp ?? ""} onChange={(event) => updateInquiry(item.id, { nextFollowUp: event.target.value || null })} /></label>
              <label>วันนัดชม<input type="datetime-local" value={item.appointmentAt ?? ""} onChange={(event) => updateInquiry(item.id, { appointmentAt: event.target.value || null })} /></label>
              <label>ข้อเสนอ (บาท)<input type="number" min="0" step="1000" value={item.offerAmount ?? ""} onChange={(event) => updateInquiry(item.id, { offerAmount: inputMoney(event.target.value) })} /></label>
              <label>มูลค่าขายอสังหาฯ<input type="number" min="0" step="1000" value={item.salePrice ?? ""} onChange={(event) => updateInquiry(item.id, { salePrice: inputMoney(event.target.value) })} /></label>
              <label>รายได้ค่าคอมมิชชัน<input type="number" min="0" step="100" value={item.commissionIncome ?? ""} onChange={(event) => updateInquiry(item.id, { commissionIncome: inputMoney(event.target.value) })} /></label>
              <label>ค่าใช้จ่ายดีล<input type="number" min="0" step="100" value={item.dealExpenses} onChange={(event) => updateInquiry(item.id, { dealExpenses: inputMoney(event.target.value) ?? 0 })} /></label>
              <label>วันที่ปิดการขาย<input type="date" value={item.closedAt?.slice(0, 10) ?? ""} onChange={(event) => updateInquiry(item.id, { closedAt: event.target.value || null })} /></label>
              <label>บันทึก<textarea value={item.adminNotes ?? ""} onChange={(event) => updateInquiry(item.id, { adminNotes: event.target.value })} rows={2} maxLength={2000} /></label>
              {(item.salePrice || item.commissionIncome) && <p className="inquiry-deal-summary"><span>ยอดขาย {formatMoney(item.salePrice ?? 0)} บาท</span><strong>รายได้สุทธิ {formatMoney((item.commissionIncome ?? 0) - item.dealExpenses)} บาท</strong></p>}
              <button type="button" onClick={() => saveInquiry(item)} disabled={item.saving}><Save /> {item.saving ? "กำลังบันทึก" : item.saved ? "บันทึกแล้ว" : "บันทึก"}</button>{item.error && <small className="inquiry-error">{item.error}</small>}
            </div>
          </section>;
        })}</div>}
      </article>
    </section>
  );
}
