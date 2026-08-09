import type { Metadata } from "next";
import Link from "next/link";
import { getContentSchedule } from "../../../db/content-schedule";
import { getManagedProperties } from "../../../db/managed-properties";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { MarketingReport } from "../../components/MarketingReport";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานการตลาด",
  robots: { index: false, follow: false },
};

export default async function MarketingReportsPage() {
  const user = await requireOwner("/admin/reports");
  const [properties, items] = await Promise.all([
    getManagedProperties(true),
    getContentSchedule(),
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
      <MarketingReport
        properties={properties}
        items={items}
        generatedAt={new Date().toISOString()}
      />
    </main>
  );
}
