"use client";

import { LockKeyhole, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

export function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, returnTo }),
      });
      const payload = (await response.json()) as {
        error?: string;
        returnTo?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
        return;
      }

      window.location.assign(payload.returnTo ?? "/admin");
    } catch {
      setError("การเชื่อมต่อขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-password">รหัสผ่านหลังบ้าน</label>
      <div className="admin-login-input">
        <LockKeyhole aria-hidden="true" />
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={12}
          maxLength={256}
          required
          autoFocus
        />
      </div>
      {error && <p className="admin-login-error" role="alert">{error}</p>}
      <button type="submit" disabled={submitting || password.length < 12}>
        {submitting ? <LoaderCircle className="admin-login-spinner" /> : <LockKeyhole />}
        {submitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
