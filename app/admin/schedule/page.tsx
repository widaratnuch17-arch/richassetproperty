import type { Metadata } from "next";
import Link from "next/link";
import { getContentSchedule, type ContentChannel } from "../../../db/content-schedule";
import { getManagedProperties } from "../../../db/managed-properties";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { ContentScheduleManager } from "../../components/ContentScheduleManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "คิวคอนเทนต์",
  robots: { index: false, follow: false },
};

const channels = new Set<ContentChannel>([
  "facebook",
  "tiktok",
  "youtube",
  "lemon8",
  "line_voom",
  "property_portal",
]);

type SchedulePageProps = {
  searchParams: Promise<{ property?: string; channel?: string }>;
};

export default async function ContentSchedulePage({ searchParams }: SchedulePageProps) {
  const user = await requireOwner("/admin/schedule");
  const [properties, initialItems, params] = await Promise.all([
    getManagedProperties(true),
    getContentSchedule(),
    searchParams,
  ]);
  const initialChannel = channels.has(params.channel as ContentChannel)
    ? (params.channel as ContentChannel)
    : undefined;

  return (
    <main className="admin-page admin-schedule-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>คิวคอนเทนต์</h1>
          <p>วางแผนโพสต์ ติดตามงาน และเก็บลิงก์ประกาศไว้ในที่เดียว</p>
        </div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link>
          <Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/buyers">ผู้ซื้อกำลังหา</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link>
          <Link href="/admin/content">ชุดโพสต์</Link>
          <Link href="/admin/reports">รายงาน</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <ContentScheduleManager
        properties={properties}
        initialItems={initialItems}
        initialPropertyId={params.property}
        initialChannel={initialChannel}
      />
    </main>
  );
}
