"use client";

import { Check, ExternalLink, Eye, EyeOff, FileText, ImagePlus, LoaderCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { Property, PropertyStatus } from "../data/properties";

const emptyProperty: Property = {
  id: "",
  type: "",
  title: "",
  location: "",
  price: "",
  land: "",
  usableArea: "",
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  summary: "",
  highlights: [],
  nearby: [],
  map: "",
  images: [],
  status: "active",
  visible: true,
};

const statusLabels: Record<PropertyStatus, string> = {
  active: "พร้อมขาย",
  reserved: "ติดจอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อนรายการ",
};

const editableStatuses: PropertyStatus[] = ["active", "reserved", "sold"];

const MAX_SOURCE_IMAGE_SIZE = 8 * 1024 * 1024;
const TARGET_IMAGE_SIZE = 1_100_000;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("ไม่สามารถปรับขนาดรูปได้")), "image/webp", quality);
  });
}

async function optimizeImage(file: File) {
  if (file.size > MAX_SOURCE_IMAGE_SIZE) throw new Error(`รูป ${file.name} มีขนาดเกิน 8 MB`);
  if (file.size <= TARGET_IMAGE_SIZE) return file;

  const bitmap = await createImageBitmap(file);
  const maxSide = 1800;
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("เบราว์เซอร์ไม่สามารถปรับรูปนี้ได้"); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await canvasBlob(canvas, .82);
  for (const quality of [.72, .62, .52]) {
    if (blob.size <= TARGET_IMAGE_SIZE) break;
    blob = await canvasBlob(canvas, quality);
  }
  if (blob.size > 1_250_000) throw new Error(`รูป ${file.name} ยังมีขนาดใหญ่เกินไป กรุณาลดขนาดรูปแล้วลองใหม่`);
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export function AdminPropertyManager({ initialProperties }: { initialProperties: Property[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [editing, setEditing] = useState<Property | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(
    () => ({
      total: properties.length,
      active: properties.filter((property) => property.status === "active").length,
      reserved: properties.filter((property) => property.status === "reserved").length,
      sold: properties.filter((property) => property.status === "sold").length,
      visible: properties.filter((property) => property.visible !== false && property.status !== "hidden").length,
      hidden: properties.filter((property) => property.visible === false || property.status === "hidden").length,
    }),
    [properties],
  );

  function startAdd() {
    setEditing({ ...emptyProperty });
    setIsNew(true);
    setMessage("");
    setError("");
  }

  function startEdit(property: Property) {
    setEditing({ ...property, images: [...property.images], highlights: [...property.highlights], nearby: [...property.nearby] });
    setIsNew(false);
    setMessage("");
    setError("");
  }

  function updateField<K extends keyof Property>(key: K, value: Property[K]) {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  }

  async function uploadImages(files: FileList | null) {
    if (!files || !editing) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const uploaded: string[] = [];
      const selected = Array.from(files).slice(0, 12);
      for (let index = 0; index < selected.length; index += 1) {
        setMessage(`กำลังปรับและอัปโหลดรูป ${index + 1}/${selected.length}`);
        const file = await optimizeImage(selected[index]);
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/property-images", { method: "POST", body });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "อัปโหลดรูปไม่สำเร็จ");
        uploaded.push(result.url);
      }
      updateField("images", [...editing.images, ...uploaded]);
      setMessage(`อัปโหลดรูปสำเร็จ ${uploaded.length} รูป`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "อัปโหลดรูปไม่สำเร็จ");
      window.setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setUploading(false);
    }
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (editing.images.length === 0) {
      setError("กรุณาเลือกรูปทรัพย์อย่างน้อย 1 รูปก่อนบันทึก");
      setMessage("");
      window.setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/properties", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const result = (await response.json()) as { property?: Property; error?: string };
      if (!response.ok || !result.property) throw new Error(result.error || "บันทึกไม่สำเร็จ");

      setProperties((current) =>
        isNew
          ? [...current, result.property!]
          : current.map((property) => (property.id === result.property!.id ? result.property! : property)),
      );
      setMessage("บันทึกข้อมูลทรัพย์เรียบร้อยแล้ว");
      setEditing(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ");
      window.setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(property: Property) {
    const visible = !(property.visible !== false && property.status !== "hidden");
    setActionId(property.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: property.id, visible }),
      });
      const result = (await response.json()) as { property?: Property; error?: string };
      if (!response.ok || !result.property) throw new Error(result.error || "เปลี่ยนการแสดงผลไม่สำเร็จ");
      setProperties((current) => current.map((item) => item.id === property.id ? result.property! : item));
      setMessage(visible ? `เปิดแสดง “${property.title}” บนเว็บไซต์แล้ว` : `ปิดการแสดง “${property.title}” แล้ว ข้อมูลยังอยู่ครบ`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "เปลี่ยนการแสดงผลไม่สำเร็จ");
    } finally {
      setActionId(null);
    }
  }

  async function removeProperty(property: Property) {
    const confirmed = window.confirm(
      `ยืนยันลบ “${property.title}” ถาวร?\n\nหน้าทรัพย์ รูปที่อัปโหลด สถิติ และแผนคอนเทนต์ที่ผูกกับทรัพย์จะถูกลบและกู้คืนไม่ได้ หากมีข้อมูลผู้สนใจ ระบบจะไม่อนุญาตให้ลบ`,
    );
    if (!confirmed) return;

    setActionId(property.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/properties", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: property.id }),
      });
      const result = (await response.json()) as { deleted?: boolean; error?: string };
      if (!response.ok || !result.deleted) throw new Error(result.error || "ลบทรัพย์ไม่สำเร็จ");
      setProperties((current) => current.filter((item) => item.id !== property.id));
      if (editing?.id === property.id) setEditing(null);
      setMessage(`ลบ “${property.title}” ออกจากระบบถาวรแล้ว`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "ลบทรัพย์ไม่สำเร็จ");
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <section className="admin-summary">
        <div><small>ทรัพย์ทั้งหมด</small><strong>{counts.total}</strong></div>
        <div><small>แสดงบนเว็บไซต์</small><strong>{counts.visible}</strong></div>
        <div><small>ปิดการแสดง</small><strong>{counts.hidden}</strong></div>
        <div><small>พร้อมขาย</small><strong>{counts.active}</strong></div>
        <div><small>ติดจอง</small><strong>{counts.reserved}</strong></div>
        <div><small>ขายแล้ว</small><strong>{counts.sold}</strong></div>
      </section>

      <section className="admin-toolbar">
        <div>
          <h2>รายการทรัพย์</h2>
          <p>แก้ราคาและสถานะได้ทันที หรือเพิ่มทรัพย์ใหม่พร้อมรูป</p>
        </div>
        <button type="button" onClick={startAdd}><Plus /> เพิ่มทรัพย์ใหม่</button>
      </section>

      {message && <p className="admin-message"><Check /> {message}</p>}
      {error && <p className="admin-error">{error}</p>}

      <section className="admin-property-list">
        {properties.map((property) => (
          <article key={property.id}>
            <span className="admin-property-thumb">
              {property.images[0] ? (
                <Image src={property.images[0]} alt="" fill sizes="150px" />
              ) : (
                <ImagePlus />
              )}
            </span>
            <div className="admin-property-info">
              <div className="admin-property-badges">
                <span className="admin-status" data-status={property.status ?? "active"}>
                  {statusLabels[property.status ?? "active"]}
                </span>
                <span className="admin-visibility" data-visible={property.visible !== false && property.status !== "hidden"}>
                  {property.visible !== false && property.status !== "hidden" ? <><Eye /> แสดงบนเว็บไซต์</> : <><EyeOff /> ปิดการแสดง</>}
                </span>
              </div>
              <h3>{property.title}</h3>
              <p>{property.location}</p>
              <strong>{property.price}</strong>
            </div>
            <div className="admin-property-actions">
              {property.visible !== false && property.status !== "hidden" && <Link href={`/properties/${property.id}`} target="_blank"><ExternalLink /> ดูหน้าเว็บ</Link>}
              <Link href={`/admin/content?property=${property.id}`}><FileText /> ชุดโพสต์</Link>
              <button type="button" onClick={() => startEdit(property)}><Pencil /> แก้ไข</button>
              <button type="button" onClick={() => void toggleVisibility(property)} disabled={actionId === property.id}>
                {actionId === property.id ? <LoaderCircle className="spin" /> : property.visible !== false && property.status !== "hidden" ? <EyeOff /> : <Eye />}
                {property.visible !== false && property.status !== "hidden" ? "ปิดแสดง" : "เปิดแสดง"}
              </button>
              <button type="button" className="admin-delete" onClick={() => void removeProperty(property)} disabled={actionId === property.id}>
                <Trash2 /> ลบ
              </button>
            </div>
          </article>
        ))}
      </section>

      {editing && (
        <div className="admin-editor-backdrop">
          <form className="admin-editor" onSubmit={saveProperty}>
            <div className="admin-editor-head">
              <div>
                <p className="section-kicker">{isNew ? "เพิ่มทรัพย์ใหม่" : "แก้ไขข้อมูล"}</p>
                <h2>{isNew ? "สร้างหน้าทรัพย์" : editing.title}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="ปิด"><X /></button>
            </div>

            <div className="admin-form-grid">
              <label>รหัส URL *
                <input value={editing.id} onChange={(event) => updateField("id", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} disabled={!isNew} required placeholder="เช่น baan-ratchapruek" />
              </label>
              <label>สถานะ *
                <select value={editing.status} onChange={(event) => updateField("status", event.target.value as PropertyStatus)}>
                  {editableStatuses.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}
                </select>
              </label>
              <label>การแสดงบนเว็บไซต์
                <select value={editing.visible === false ? "hidden" : "visible"} onChange={(event) => updateField("visible", event.target.value === "visible")}>
                  <option value="visible">เปิดแสดง</option>
                  <option value="hidden">ปิดการแสดง แต่เก็บข้อมูลไว้</option>
                </select>
              </label>
              <label>ประเภททรัพย์ *
                <input value={editing.type} onChange={(event) => updateField("type", event.target.value)} required placeholder="บ้านเดี่ยว / ทาวน์โฮม / คอนโด" />
              </label>
              <label>ราคาที่แสดง *
                <input value={editing.price} onChange={(event) => updateField("price", event.target.value)} required placeholder="4,500,000 บาท" />
              </label>
              <label className="admin-field-wide">ชื่อทรัพย์ *
                <input value={editing.title} onChange={(event) => updateField("title", event.target.value)} required />
              </label>
              <label className="admin-field-wide">ทำเล *
                <input value={editing.location} onChange={(event) => updateField("location", event.target.value)} required />
              </label>
              <label>ขนาดที่ดิน
                <input value={editing.land} onChange={(event) => updateField("land", event.target.value)} placeholder="50 ตร.ว." />
              </label>
              <label>พื้นที่ใช้สอย
                <input value={editing.usableArea} onChange={(event) => updateField("usableArea", event.target.value)} placeholder="180 ตร.ม." />
              </label>
              <label>ห้องนอน
                <input type="number" min="0" value={editing.bedrooms} onChange={(event) => updateField("bedrooms", Number(event.target.value))} />
              </label>
              <label>ห้องน้ำ
                <input type="number" min="0" value={editing.bathrooms} onChange={(event) => updateField("bathrooms", Number(event.target.value))} />
              </label>
              <label>ที่จอดรถ
                <input type="number" min="0" value={editing.parking} onChange={(event) => updateField("parking", Number(event.target.value))} />
              </label>
              <label>ลิงก์แผนที่
                <input value={editing.map} onChange={(event) => updateField("map", event.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </label>
              <label className="admin-field-wide">คำอธิบายหลัก *
                <textarea rows={4} value={editing.summary} onChange={(event) => updateField("summary", event.target.value)} required />
              </label>
              <label className="admin-field-wide">จุดเด่น — หนึ่งข้อต่อบรรทัด
                <textarea rows={5} value={editing.highlights.join("\n")} onChange={(event) => updateField("highlights", event.target.value.split("\n").filter(Boolean))} />
              </label>
              <label className="admin-field-wide">สถานที่ใกล้เคียง — หนึ่งแห่งต่อบรรทัด
                <textarea rows={5} value={editing.nearby.join("\n")} onChange={(event) => updateField("nearby", event.target.value.split("\n").filter(Boolean))} />
              </label>
            </div>

            <div className="admin-images">
              <div className="admin-images-head">
                <div><strong>รูปทรัพย์ *</strong><small>รูปแรกใช้เป็นภาพปก รองรับ JPG, PNG, WebP ไม่เกิน 8 MB ระบบจะปรับขนาดให้อัตโนมัติ</small></div>
                <label className="admin-upload-button">
                  {uploading ? <LoaderCircle className="spin" /> : <ImagePlus />}
                  {uploading ? "กำลังอัปโหลด" : "เลือกรูป"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { void uploadImages(event.currentTarget.files); event.currentTarget.value = ""; }} disabled={uploading} />
                </label>
              </div>
              <div className="admin-editor-feedback" ref={feedbackRef} aria-live="polite">
                {uploading && <p>กำลังอัปโหลดรูป กรุณารอสักครู่...</p>}
                {message && <p className="admin-message"><Check /> {message}</p>}
                {error && <p className="admin-error">{error}</p>}
              </div>
              <div className="admin-image-grid">
                {editing.images.map((image, index) => (
                  <div className="admin-image-item" key={`${image}-${index}`}>
                    <Image src={image} alt="" fill sizes="(max-width: 600px) 44vw, 210px" />
                    {index === 0 && <span>ภาพปก</span>}
                    <button type="button" onClick={() => updateField("images", editing.images.filter((_, imageIndex) => imageIndex !== index))}><X /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-editor-actions">
              <button type="button" className="admin-cancel" onClick={() => setEditing(null)}>ยกเลิก</button>
              <button type="submit" className="admin-primary" disabled={saving || uploading}>
                {saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "กำลังบันทึก" : "บันทึกข้อมูลทรัพย์"}
              </button>
            </div>
            <small className="admin-save-hint">ต้องอัปโหลดรูปสำเร็จอย่างน้อย 1 รูปก่อน จึงจะบันทึกข้อมูลทรัพย์ได้</small>
          </form>
        </div>
      )}
    </>
  );
}
