"use client";

import { ArrowRight, Check, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { getClientAttribution } from "./PropertyAnalytics";

const LINE_URL = "https://line.me/ti/p/~richhouseagent99";
type SubmitState = "idle" | "submitting" | "success" | "error";

export function BuyerRequestForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      lineId: formData.get("lineId"),
      propertyType: formData.get("propertyType"),
      preferredLocations: formData.get("preferredLocations"),
      budgetRange: formData.get("budgetRange"),
      bedrooms: formData.get("bedrooms"),
      timeline: formData.get("timeline"),
      financing: formData.get("financing"),
      details: formData.get("details"),
      website: formData.get("website"),
      consent: formData.get("consent") === "on",
      ...getClientAttribution(),
    };

    try {
      const response = await fetch("/api/buyer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "ส่งข้อมูลไม่สำเร็จ");
      form.reset();
      setState("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="buyer-request-success" role="status">
        <span><Check /></span>
        <p className="section-kicker">รับข้อมูลแล้ว</p>
        <h3>นุชจะช่วยคัดทรัพย์ที่ตรงเงื่อนไขให้</h3>
        <p>นุชจะตรวจงบ ทำเล และความพร้อมก่อนติดต่อกลับ เพื่อไม่ส่งทรัพย์ที่ไม่ตรงความต้องการ</p>
        <a href={LINE_URL} target="_blank" rel="noreferrer">
          <MessageCircle /> ทัก LINE เพิ่มเติม <ArrowRight />
        </a>
        <button type="button" onClick={() => setState("idle")}>ส่งความต้องการใหม่</button>
      </div>
    );
  }

  return (
    <form className="buyer-request-form" onSubmit={handleSubmit}>
      <div className="buyer-request-form-head">
        <div>
          <strong>ฝากความต้องการซื้อ</strong>
          <small>ใช้เวลาประมาณ 1 นาที</small>
        </div>
        <span>ไม่มีค่าใช้จ่าย</span>
      </div>

      <div className="buyer-request-form-row">
        <label>ชื่อ <span>*</span>
          <input name="fullName" type="text" autoComplete="name" required maxLength={100} />
        </label>
        <label>เบอร์โทร <span>*</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} />
        </label>
      </div>

      <div className="buyer-request-form-row">
        <label>ประเภททรัพย์ <span>*</span>
          <select name="propertyType" required defaultValue="">
            <option value="" disabled>เลือกประเภททรัพย์</option>
            <option>บ้านเดี่ยว</option><option>บ้านแฝด</option><option>ทาวน์โฮม</option>
            <option>คอนโด</option><option>ที่ดิน</option><option>อาคารพาณิชย์</option><option>ยังไม่แน่ใจ</option>
          </select>
        </label>
        <label>งบประมาณ <span>*</span>
          <select name="budgetRange" required defaultValue="">
            <option value="" disabled>เลือกช่วงงบประมาณ</option>
            <option>ไม่เกิน 2 ล้านบาท</option><option>2–3 ล้านบาท</option><option>3–5 ล้านบาท</option>
            <option>5–10 ล้านบาท</option><option>มากกว่า 10 ล้านบาท</option><option>ยังไม่กำหนด</option>
          </select>
        </label>
      </div>

      <label>ทำเลที่ต้องการ <span>*</span>
        <input name="preferredLocations" type="text" required maxLength={240} placeholder="เช่น บางบัวทอง บางใหญ่ ใกล้ MRT สายสีม่วง" />
      </label>

      <div className="buyer-request-form-row buyer-request-form-row--three">
        <label>จำนวนห้องนอน
          <select name="bedrooms" defaultValue="">
            <option value="">ไม่ระบุ</option><option value="1">1 ห้อง</option><option value="2">2 ห้อง</option>
            <option value="3">3 ห้อง</option><option value="4">4 ห้อง</option><option value="5">5 ห้องขึ้นไป</option>
          </select>
        </label>
        <label>ต้องการซื้อเมื่อไร <span>*</span>
          <select name="timeline" required defaultValue="">
            <option value="" disabled>เลือกช่วงเวลา</option><option>ภายใน 1 เดือน</option><option>1–3 เดือน</option>
            <option>3–6 เดือน</option><option>มากกว่า 6 เดือน</option><option>กำลังศึกษาข้อมูล</option>
          </select>
        </label>
        <label>ความพร้อมด้านสินเชื่อ <span>*</span>
          <select name="financing" required defaultValue="">
            <option value="" disabled>เลือกความพร้อม</option><option>เงินสด</option><option>มีวงเงินอนุมัติแล้ว</option>
            <option>ต้องการให้ช่วยเรื่องสินเชื่อ</option><option>ยังไม่แน่ใจ</option>
          </select>
        </label>
      </div>

      <label>รายละเอียดเพิ่มเติม
        <textarea name="details" rows={4} maxLength={1200} placeholder="เช่น ต้องการบ้านไม่เกิน 10 ปี มีพื้นที่สำหรับสัตว์เลี้ยง และเดินทางเข้าเมืองสะดวก" />
      </label>

      <label>LINE ID (ถ้ามี)
        <input name="lineId" type="text" autoComplete="off" maxLength={100} />
      </label>

      <label className="honeypot" aria-hidden="true">เว็บไซต์
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="buyer-request-consent">
        <input name="consent" type="checkbox" required />
        <span>ยินยอมให้นุชติดต่อกลับเกี่ยวกับการค้นหาทรัพย์ และรับทราบ <a href="/privacy" target="_blank">ประกาศความเป็นส่วนตัว</a></span>
      </label>

      {state === "error" && <p className="form-error" role="alert">{errorMessage}</p>}
      <button className="buyer-request-submit" type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? <LoaderCircle className="spin" /> : <Send />}
        {state === "submitting" ? "กำลังส่งข้อมูล" : "ให้นุชช่วยหาทรัพย์"}
      </button>
      <p className="buyer-request-security">ข้อมูลนี้ใช้สำหรับติดต่อกลับเท่านั้น และจะไม่แสดงบนหน้าเว็บไซต์</p>
    </form>
  );
}
