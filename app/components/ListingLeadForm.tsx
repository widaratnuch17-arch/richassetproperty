"use client";

import { ArrowRight, Check, Clipboard, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

const LINE_URL = "https://line.me/ti/p/~richhouseagent99";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ListingLeadForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lineSummary, setLineSummary] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");
    setCopied(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      lineId: formData.get("lineId"),
      propertyType: formData.get("propertyType"),
      location: formData.get("location"),
      askingPrice: formData.get("askingPrice"),
      timeline: formData.get("timeline"),
      details: formData.get("details"),
      website: formData.get("website"),
      consent: formData.get("consent") === "on",
    };

    try {
      const response = await fetch("/api/listing-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถส่งข้อมูลได้");
      }

      const summary = [
        "สวัสดีค่ะนุช ส่งข้อมูลฝากขายจากเว็บไซต์",
        `ชื่อ: ${payload.fullName}`,
        `โทร: ${payload.phone}`,
        payload.lineId ? `LINE: ${payload.lineId}` : "",
        `ประเภททรัพย์: ${payload.propertyType}`,
        `ทำเล: ${payload.location}`,
        payload.askingPrice ? `ราคาที่ต้องการขาย: ${payload.askingPrice}` : "",
        payload.timeline ? `ช่วงเวลาที่ต้องการขาย: ${payload.timeline}` : "",
        payload.details ? `รายละเอียดเพิ่มเติม: ${payload.details}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      setLineSummary(summary);
      setSubmitState("success");
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ไม่สามารถส่งข้อมูลได้ กรุณาติดต่อทาง LINE หรือโทรหานุช",
      );
      setSubmitState("error");
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(lineSummary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (submitState === "success") {
    return (
      <div className="lead-success" role="status">
        <span className="lead-success-icon"><Check /></span>
        <p className="section-kicker">ส่งข้อมูลเรียบร้อย</p>
        <h3>ขั้นต่อไป ทัก LINE หานุชได้เลย</h3>
        <p>
          ระบบบันทึกข้อมูลของคุณแล้ว กดคัดลอกข้อความสรุปและส่งใน LINE
          เพื่อให้นุชเริ่มดูข้อมูลได้ทันที
        </p>
        <div className="lead-success-actions">
          <button type="button" className="button button--ghost" onClick={copySummary}>
            <Clipboard /> {copied ? "คัดลอกแล้ว" : "คัดลอกข้อมูล"}
          </button>
          <a className="button button--primary" href={LINE_URL} target="_blank" rel="noreferrer">
            <MessageCircle /> ไปที่ LINE <ArrowRight />
          </a>
        </div>
        <button type="button" className="lead-reset" onClick={() => setSubmitState("idle")}>
          ส่งข้อมูลทรัพย์อีกหลัง
        </button>
      </div>
    );
  }

  return (
    <form className="listing-lead-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          ชื่อผู้ติดต่อ <span>*</span>
          <input name="fullName" type="text" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          เบอร์โทร <span>*</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={30}
            placeholder="เช่น 08x-xxx-xxxx"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          LINE ID
          <input name="lineId" type="text" autoComplete="off" maxLength={100} />
        </label>
        <label>
          ประเภททรัพย์ <span>*</span>
          <select name="propertyType" required defaultValue="">
            <option value="" disabled>เลือกประเภททรัพย์</option>
            <option value="บ้านเดี่ยว">บ้านเดี่ยว</option>
            <option value="บ้านแฝด">บ้านแฝด</option>
            <option value="ทาวน์โฮม">ทาวน์โฮม</option>
            <option value="คอนโด">คอนโด</option>
            <option value="ที่ดิน">ที่ดิน</option>
            <option value="อื่น ๆ">อื่น ๆ</option>
          </select>
        </label>
      </div>

      <label>
        ทำเล / โครงการ / จังหวัด <span>*</span>
        <input
          name="location"
          type="text"
          required
          maxLength={200}
          placeholder="เช่น หมู่บ้าน... ถนนราชพฤกษ์ นนทบุรี"
        />
      </label>

      <div className="form-row">
        <label>
          ราคาที่ต้องการขาย
          <input
            name="askingPrice"
            type="text"
            inputMode="numeric"
            maxLength={80}
            placeholder="เช่น 4,500,000 บาท"
          />
        </label>
        <label>
          ต้องการขายเมื่อไร
          <select name="timeline" defaultValue="">
            <option value="">ยังไม่แน่ใจ</option>
            <option value="ภายใน 1–3 เดือน">ภายใน 1–3 เดือน</option>
            <option value="ภายใน 3–6 เดือน">ภายใน 3–6 เดือน</option>
            <option value="ภายในปีนี้">ภายในปีนี้</option>
            <option value="กำลังศึกษาข้อมูล">กำลังศึกษาข้อมูล</option>
          </select>
        </label>
      </div>

      <label>
        รายละเอียดเพิ่มเติม
        <textarea
          name="details"
          rows={4}
          maxLength={1200}
          placeholder="ขนาดที่ดิน จำนวนห้อง สภาพบ้าน ภาระจำนอง หรือข้อมูลที่อยากให้นุชทราบ"
        />
      </label>

      <label className="honeypot" aria-hidden="true">
        เว็บไซต์
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="form-consent">
        <input name="consent" type="checkbox" required />
        <span>
          ยินยอมให้นุชติดต่อกลับเพื่อประเมินแนวทางฝากขาย
          ข้อมูลนี้ใช้สำหรับการให้คำปรึกษาเรื่องทรัพย์เท่านั้น อ่าน{" "}
          <a href="/privacy" target="_blank">ประกาศความเป็นส่วนตัว</a>
        </span>
      </label>

      {submitState === "error" && (
        <p className="form-error" role="alert">{errorMessage}</p>
      )}

      <button
        className="lead-submit"
        type="submit"
        disabled={submitState === "submitting"}
      >
        {submitState === "submitting" ? (
          <><LoaderCircle className="spin" /> กำลังส่งข้อมูล</>
        ) : (
          <>ส่งข้อมูลให้นุชประเมิน <ArrowRight /></>
        )}
      </button>

      <p className="form-security">
        <ShieldCheck /> ไม่มีค่าใช้จ่ายในการส่งข้อมูล และยังไม่ถือเป็นการทำสัญญาฝากขาย
      </p>
    </form>
  );
}
