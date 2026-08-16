import type { Metadata } from "next";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HandCoins,
  House,
  MessageCircle,
  Phone,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { adminSignOutPath, requireOwner } from "../admin-auth";
import { getBuyerRequests } from "../../db/buyer-requests";
import { getListingLeads } from "../../db/listing-leads";
import { getManagedProperties } from "../../db/managed-properties";
import { getPropertyInquiries } from "../../db/property-analytics";

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

export default async function AdminDashboardPage() {
  const user = await requireOwner("/admin");
  const [leads, properties, buyerLeads, buyerRequests] = await Promise.all([
    getListingLeads(),
    getManagedProperties(true),
    getPropertyInquiries(),
    getBuyerRequests(),
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
      const priority = (lead: (typeof leads)[number]) => {
        if (lead.status === "new") return 0;
        if (lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today) return 1;
        return 2;
      };
      return priority(a) - priority(b) || b.id - a.id;
    })
    .slice(0, 8);
  const activeProperties = properties.filter((property) => property.status === "active");
  const openBuyerLeads = buyerLeads.filter((lead) => !["won", "closed"].includes(lead.status));
  const buyerNew = openBuyerLeads.filter((lead) => lead.status === "new");
  const buyerOverdue = openBuyerLeads.filter((lead) => lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today);
  const buyerDueToday = openBuyerLeads.filter((lead) => lead.nextFollowUp?.slice(0, 10) === today);
  const openBuyerRequests = buyerRequests.filter((lead) => !["won", "closed"].includes(lead.status));
  const buyerRequestNew = openBuyerRequests.filter((lead) => lead.status === "new");
  const buyerRequestOverdue = openBuyerRequests.filter((lead) => lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today);
  const buyerRequestDueToday = openBuyerRequests.filter((lead) => lead.nextFollowUp?.slice(0, 10) === today);
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const buyerActions = openBuyerLeads
    .filter((lead) => lead.status === "new" || Boolean(lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) <= today))
    .map((lead) => ({
      key: `buyer-${lead.id}`, type: "ผู้ซื้อ", fullName: lead.fullName, phone: lead.phone, lineId: lead.lineId,
      detail: propertyById.get(lead.propertyId)?.title ?? lead.propertyId, nextFollowUp: lead.nextFollowUp,
      isNew: lead.status === "new", href: "/admin/reports#buyer-pipeline",
    }));
  const buyerRequestActions = openBuyerRequests
    .filter((lead) => lead.status === "new" || Boolean(lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) <= today))
    .map((lead) => ({
      key: `buyer-request-${lead.id}`, type: "ผู้ซื้อกำลังหา", fullName: lead.fullName, phone: lead.phone, lineId: lead.lineId,
      detail: `${lead.propertyType} · ${lead.preferredLocations}`, nextFollowUp: lead.nextFollowUp,
      isNew: lead.status === "new", href: "/admin/buyers?filter=attention",
    }));
  const sellerActions = actionLeads.map((lead) => ({
    key: `seller-${lead.id}`, type: "ฝากขาย", fullName: lead.fullName, phone: lead.phone, lineId: lead.lineId,
    detail: `${lead.propertyType} · ${lead.location}`, nextFollowUp: lead.nextFollowUp,
    isNew: lead.status === "new", href: "/admin/leads?filter=attention",
  }));
  const combinedActions = [...buyerRequestActions, ...buyerActions, ...sellerActions]
    .sort((a, b) => Number(b.isNew) - Number(a.isNew) || (a.nextFollowUp ?? "").localeCompare(b.nextFollowUp ?? ""))
    .slice(0, 10);
  const currentYear = today.slice(0, 4);
  const currentMonth = today.slice(0, 7);
  const closedThisYear = [...buyerLeads, ...buyerRequests].filter((lead) => lead.status === "won" && lead.closedAt?.slice(0, 4) === currentYear);
  const closedThisMonth = closedThisYear.filter((lead) => lead.closedAt?.slice(0, 7) === currentMonth);
  const total = (items: typeof closedThisYear, field: "salePrice" | "commissionIncome" | "dealExpenses") =>
    items.reduce((sum, item) => sum + (item[field] ?? 0), 0);
  const annualSales = total(closedThisYear, "salePrice");
  const annualCommission = total(closedThisYear, "commissionIncome");
  const annualExpenses = total(closedThisYear, "dealExpenses");
  const annualNet = annualCommission - annualExpenses;
  const monthlyNet = total(closedThisMonth, "commissionIncome") - total(closedThisMonth, "dealExpenses");
  const money = (value: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value);

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
          <Link href="/admin/buyers">ผู้ซื้อกำลังหา</Link>
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
          <span><small>ลีดใหม่ทั้งหมด</small><strong>{newLeads.length + buyerNew.length + buyerRequestNew.length}</strong></span>
        </Link>
        <Link href="/admin/leads?filter=attention" data-tone="red">
          <AlertCircle />
          <span><small>เลยวันติดตาม</small><strong>{overdueLeads.length + buyerOverdue.length + buyerRequestOverdue.length}</strong></span>
        </Link>
        <Link href="/admin/leads?filter=attention" data-tone="amber">
          <CalendarClock />
          <span><small>ต้องติดตามวันนี้</small><strong>{dueTodayLeads.length + buyerDueToday.length + buyerRequestDueToday.length}</strong></span>
        </Link>
        <Link href="/admin/properties" data-tone="green">
          <House />
          <span><small>ทรัพย์พร้อมขาย</small><strong>{activeProperties.length}</strong></span>
        </Link>
      </section>

      <section className="business-goal-panel">
        <div className="business-goal-heading"><div><p className="section-kicker">เป้าหมายธุรกิจ {currentYear}</p><h2>ยอดขายและรายได้จริง</h2></div><Link href="/admin/reports#buyer-pipeline">อัปเดตดีล <ArrowRight /></Link></div>
        <div className="business-goal-cards">
          <article><House /><div><small>มูลค่าขายอสังหาฯ ปีนี้</small><strong>{money(annualSales)} บาท</strong><span>{Math.min(100, (annualSales / 50_000_000) * 100).toFixed(1)}% ของเป้า 50 ล้านบาท</span><i><b style={{ width: `${Math.min(100, (annualSales / 50_000_000) * 100)}%` }} /></i></div></article>
          <article><CircleDollarSign /><div><small>รายได้ค่าคอมมิชชันปีนี้</small><strong>{money(annualCommission)} บาท</strong><span>แยกจากมูลค่าขายอสังหาฯ</span></div></article>
          <article><WalletCards /><div><small>ค่าใช้จ่ายดีลปีนี้</small><strong>{money(annualExpenses)} บาท</strong><span>หักจากค่าคอมมิชชัน</span></div></article>
          <article><HandCoins /><div><small>รายได้สุทธิเดือนนี้</small><strong>{money(monthlyNet)} บาท</strong><span>{Math.min(100, (monthlyNet / 200_000) * 100).toFixed(1)}% ของเป้า 200,000 บาท</span><i><b style={{ width: `${Math.max(0, Math.min(100, (monthlyNet / 200_000) * 100))}%` }} /></i></div></article>
        </div>
        <p className="business-goal-net">รายได้สุทธิสะสมปีนี้ = ค่าคอมมิชชัน {money(annualCommission)} − ค่าใช้จ่ายดีล {money(annualExpenses)} = <strong>{money(annualNet)} บาท</strong></p>
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

          {combinedActions.length === 0 ? (
            <div className="admin-today-empty">
              <CheckCircle2 />
              <h3>งานติดตามครบแล้ว</h3>
              <p>ไม่มีลูกค้าใหม่หรืองานที่เลยกำหนดในขณะนี้</p>
            </div>
          ) : (
            <div className="admin-today-list">
              {combinedActions.map((lead) => (
                <article key={lead.key}>
                  <div className="admin-today-person">
                    <span>{lead.fullName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <small>{lead.type} · {lead.isNew ? "ลีดใหม่ ควรติดต่อกลับ" : lead.nextFollowUp && lead.nextFollowUp.slice(0, 10) < today ? "เลยวันติดตาม" : "ติดตามวันนี้"}</small>
                      <h3>{lead.fullName}</h3>
                      <p>{lead.detail}</p>
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
                    <Link href={lead.href}>
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
            <p><span>ปิดการแสดง</span><strong>{properties.filter((item) => item.visible === false || item.status === "hidden").length}</strong></p>
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
