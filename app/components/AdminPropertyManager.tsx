"use client";

import { Check, ExternalLink, ImagePlus, LoaderCircle, Pencil, Plus, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
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
};

const statusLabels: Record<PropertyStatus, string> = {
  active: "พร้อมขาย",
  reserved: "ติดจอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อนรายการ",
};

export function AdminPropertyManager({ initialProperties }: { initialProperties: Property[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [editing, setEditing] = useState<Property | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      total: properties.length,
      active: properties.filter((property) => property.status === "active").length,
      reserved: properties.filter((property) => property.status === "reserved").length,
      sold: properties.filter((property) => property.status === "sold").length,
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
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 12)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/property-images", { method: "POST", body });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "อัปโหลดรูปไม่สำเร็จ");
        uploaded.push(result.url);
      }
      updateField("images", [...editing.images, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="admin-summary">
        <div><small>ทรัพย์ทั้งหมด</small><strong>{counts.total}</strong></div>
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
              <span className="admin-status" data-status={property.status ?? "active"}>
                {statusLabels[property.status ?? "active"]}
              </span>
              <h3>{property.title}</h3>
              <p>{property.location}</p>
              <strong>{property.price}</strong>
            </div>
            <div className="admin-property-actions">
              <Link href={`/properties/${property.id}`} target="_blank"><ExternalLink /> ดูหน้าเว็บ</Link>
              <button type="button" onClick={() => startEdit(property)}><Pencil /> แก้ไข</button>
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
                  {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
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
                <div><strong>รูปทรัพย์ *</strong><small>รูปแรกใช้เป็นภาพปก รองรับ JPG, PNG, WebP ไม่เกิน 8 MB</small></div>
                <label className="admin-upload-button">
                  {uploading ? <LoaderCircle className="spin" /> : <ImagePlus />}
                  {uploading ? "กำลังอัปโหลด" : "เลือกรูป"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => uploadImages(event.target.files)} disabled={uploading} />
                </label>
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
          </form>
        </div>
      )}
    </>
  );
}
