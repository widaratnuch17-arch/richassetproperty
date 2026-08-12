"use client";

import { Check, LoaderCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { getClientAttribution } from "./PropertyAnalytics";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function PropertyInquiryForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      propertyId,
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      lineId: formData.get("lineId"),
      message: formData.get("message"),
      website: formData.get("website"),
      consent: formData.get("consent") === "on",
      ...getClientAttribution(),
    };

    try {
      const response = await fetch("/api/property-inquiries", {
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
      <div className="property-inquiry-success" role="status">
        <Check />
        <div>
          <strong>ส่งข้อมูลให้นุชแล้ว</strong>
          <p>นุชจะติดต่อกลับเพื่อเช็กสถานะและนัดชม {propertyTitle}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="property-inquiry-form" onSubmit={handleSubmit}>
      <div className="property-inquiry-head">
        <strong>ให้นุชติดต่อกลับ</strong>
        <small>กรอกสั้น ๆ ใช้เวลาไม่ถึง 1 นาที</small>
      </div>
      <div className="property-inquiry-row">
        <label>
          ชื่อ <span>*</span>
          <input name="fullName" type="text" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          เบอร์โทร <span>*</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} />
        </label>
      </div>
      <label>
        LINE ID (ถ้ามี)
        <input name="lineId" type="text" autoComplete="off" maxLength={100} />
      </label>
      <label>
        สิ่งที่ต้องการสอบถาม
        <textarea
          name="message"
          rows={3}
          maxLength={600}
          placeholder="เช่น ต้องการนัดชมวันเสาร์ หรือต้องการประเมินวงเงินกู้"
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        เว็บไซต์
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="property-inquiry-consent">
        <input name="consent" type="checkbox" required />
        <span>
          ยินยอมให้นุชติดต่อกลับเกี่ยวกับทรัพย์นี้ และรับทราบ{" "}
          <a href="/privacy" target="_blank">ประกาศความเป็นส่วนตัว</a>
        </span>
      </label>
      {state === "error" && <p className="form-error" role="alert">{errorMessage}</p>}
      <button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? <LoaderCircle className="spin" /> : <Send />}
        {state === "submitting" ? "กำลังส่งข้อมูล" : "ขอให้นุชติดต่อกลับ"}
      </button>
    </form>
  );
}
