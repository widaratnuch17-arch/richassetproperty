import type { Metadata } from "next";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  House,
  MessageCircle,
  Phone,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { adminSignOutPath, requireOwner } from "../admin-auth";
import { getListingLeads, type ListingLead } from "../../db/listing-leads";
import { getManagedProperties } from "../../db/managed-properties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "งานวันนี้",
  robots: { index: false, follow: false },
};

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

function actionLabel(lead: ListingLead, today: string) {
  if (lead.status === "new") return "ลูกค้าใหม่ · ควรติดต่อกลับ";
  const followUpDate = lead.nextFollowUp?.slice(0, 10);
  if (followUpDate && followUpDate < today) return "เลยวันติดตาม";
  return "ติดตามวันนี้";
}

export default async function AdminDashboardPage() {
  const user = await requireOwner("/admin");
  const [leads, properties] = await Promise.all([
    getListingLeads(),
    getManagedProperties(true),
  ]);
  const today = bangkokToday();
  const openLeads = leads.filter((lead) => !["won", "closed"].includes(lead.status));
  const newLeads = openLeads.filter((lead) => lead.status === "new");
  const overdueLeads = openLeads.filter(
    (lead) => lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today,
  );
  const dueTodayLeads = openLeads.filter(
    (lead) => lead.nextFollowUp?.slice(0, 10) === today,
  );
  const actionLeads = leads
    .filter(
      (lead) =>
        !["won", "closed"].includes(lead.status) &&
        (lead.status === "new" ||
          Boolean(lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) <= today)),
    )
    .sort((a, b) => {
      const priority = (lead: ListingLead) => {
        if (lead.status === "new") return 0;
        if (lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today) return 1;
        return 2;
      };
      return priority(a) - priority(b) || b.id - a.id;
    })
    .slice(0, 8);
  const activeProperties = properties.filter((property) => property.status === "active");

  return (
    <main className="admin-page admin-dashboard-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>งานวันนี้</h1>
          <p>สวัสดี {user.displayName} · สรุปงานที่ควรจัดการก่อน</p>
        </div>
        <nav>
          <Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link>
          <Link href="/admin/content">ชุดโพสต์</Link>
          <Link href="/admin/schedule">คิวคอนเทนต์</Link>
          <Link href="/admin/reports">รายงาน</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>

      <section className="admin-summary admin-dashboard-summary">
        <Link href="/admin/leads?filter=attention" data-tone="blue">
          <UserRoundPlus />
          <span><small>ลูกค้าใหม่</small><strong>{newLeads.length}</strong></span>
        </Link>
        <Link href="/admin/leads?filter=attention" data-tone="red">
          <AlertCircle />
          <span><small>เลยวันติดตาม</small><strong>{overdueLeads.length}</strong></span>
        </Link>
        <Link href="/admin/leads?filter=attention" data-tone="amber">
          <CalendarClock />
          <span><small>ต้องติดตามวันนี้</small><strong>{dueTodayLeads.length}</strong></span>
        </Link>
        <Link href="/admin/properties" data-tone="green">
          <House />
          <span><small>ทรัพย์พร้อมขาย</small><strong>{activeProperties.length}</strong></span>
        </Link>
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-today-panel">
          <div className="admin-panel-head">
            <div>
              <p className="section-kicker">ลำดับความสำคัญ</p>
              <h2>ลูกค้าที่ควรติดต่อ</h2>
            </div>
            <Link href="/admin/leads?filter=attention">
              ดูรายการทั้งหมด <ArrowRight />
            </Link>
          </div>

          {actionLeads.length === 0 ? (
            <div className="admin-today-empty">
              <CheckCircle2 />
              <h3>งานติดตามครบแล้ว</h3>
              <p>ไม่มีลูกค้าใหม่หรืองานที่เลยกำหนดในขณะนี้</p>
            </div>
          ) : (
            <div className="admin-today-list">
              {actionLeads.map((lead) => (
                <article key={lead.id}>
                  <div className="admin-today-person">
                    <span>{lead.fullName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <small>{actionLabel(lead, today)}</small>
                      <h3>{lead.fullName}</h3>
                      <p>{lead.propertyType} · {lead.location}</p>
                      {lead.nextFollowUp && (
                        <p className="admin-today-time">
                          <Clock3 /> {formatFollowUp(lead.nextFollowUp)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="admin-today-actions">
                    <a href={`tel:${lead.phone.replace(/\D/g, "")}`} aria-label={`โทรหา ${lead.fullName}`}>
                      <Phone />
                    </a>
                    {lead.lineId && (
                      <a
                        href={lineUrl(lead.lineId)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`เปิด LINE ของ ${lead.fullName}`}
                      >
                        <MessageCircle />
                      </a>
                    )}
                    <Link href="/admin/leads?filter=attention">
                      เปิดข้อมูล <ArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="admin-overview-panel">
          <div className="admin-panel-head">
            <div>
              <p className="section-kicker">ภาพรวมพอร์ต</p>
              <h2>สถานะทรัพย์</h2>
            </div>
          </div>
          <div className="admin-property-overview">
            <p><span>พร้อมขาย</span><strong>{activeProperties.length}</strong></p>
            <p><span>ติดจอง</span><strong>{properties.filter((item) => item.status === "reserved").length}</strong></p>
            <p><span>ขายแล้ว</span><strong>{properties.filter((item) => item.status === "sold").length}</strong></p>
            <p><span>ซ่อนรายการ</span><strong>{properties.filter((item) => item.status === "hidden").length}</strong></p>
          </div>
          <Link className="admin-overview-link" href="/admin/properties">
            จัดการข้อมูลทรัพย์ <ArrowRight />
          </Link>

          <div className="admin-daily-routine">
            <p className="section-kicker">ทำตามลำดับนี้</p>
            <ol>
              <li><span>1</span><p><strong>ติดต่อลูกค้าใหม่</strong><small>ตอบเร็วเพื่อไม่ให้โอกาสหลุด</small></p></li>
              <li><span>2</span><p><strong>ปิดงานที่ถึงกำหนด</strong><small>โทรหรือทัก LINE แล้วบันทึกผล</small></p></li>
              <li><span>3</span><p><strong>อัปเดตสถานะทรัพย์</strong><small>ราคาและสถานะต้องตรงกับปัจจุบัน</small></p></li>
            </ol>
          </div>
        </aside>
      </section>
    </main>
  );
}
