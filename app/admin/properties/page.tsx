import type { Metadata } from "next";
import Link from "next/link";
import { AdminPropertyManager } from "../../components/AdminPropertyManager";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { getManagedProperties } from "../../../db/managed-properties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการทรัพย์",
  robots: { index: false, follow: false },
};

export default async function AdminPropertiesPage() {
  const user = await requireOwner("/admin/properties");
  const properties = await getManagedProperties(true);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>จัดการทรัพย์</h1>
          <p>เข้าสู่ระบบในชื่อ {user.displayName}</p>
        </div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link>
          <Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/buyers">ผู้ซื้อกำลังหา</Link>
          <Link href="/admin/content">ชุดโพสต์</Link>
          <Link href="/admin/schedule">คิวคอนเทนต์</Link>
          <Link href="/admin/reports">รายงาน</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <AdminPropertyManager initialProperties={properties} />
    </main>
  );
}
