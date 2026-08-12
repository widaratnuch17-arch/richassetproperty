import type { Metadata } from "next";
import Link from "next/link";
import { getContentSchedule } from "../../../db/content-schedule";
import { getManagedProperties } from "../../../db/managed-properties";
import { getPropertyPerformance } from "../../../db/property-analytics";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { MarketingReport } from "../../components/MarketingReport";
import { PropertyPerformanceReport } from "../../components/PropertyPerformanceReport";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานการตลาด",
  robots: { index: false, follow: false },
};

export default async function MarketingReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requireOwner("/admin/reports");
  const selectedDays = Number((await searchParams).days ?? 30);
  const days = [0, 7, 30, 90].includes(selectedDays) ? selectedDays : 30;
  const [properties, items, performance] = await Promise.all([
    getManagedProperties(true),
    getContentSchedule(),
    getPropertyPerformance(days),
  ]);

  return (
    <main className="admin-page admin-report-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>รายงานการตลาด</h1>
          <p>ดูความคืบหน้าการกระจายประกาศและเลือกทรัพย์ที่ควรเร่งทำก่อน</p>
        </div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link>
          <Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link>
          <Link href="/admin/content">ชุดโพสต์</Link>
          <Link href="/admin/schedule">คิวคอนเทนต์</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <PropertyPerformanceReport
        properties={properties}
        initialEvents={performance.events}
        initialInquiries={performance.inquiries}
        days={days}
      />
      <MarketingReport
        properties={properties}
        items={items}
        generatedAt={new Date().toISOString()}
      />
    </main>
  );
}
