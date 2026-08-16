import type { Metadata } from "next";
import Link from "next/link";
import { getBuyerRequests } from "../../../db/buyer-requests";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { BuyerRequestManager } from "../../components/BuyerRequestManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ผู้ซื้อกำลังหาทรัพย์",
  robots: { index: false, follow: false },
};

type AdminBuyersPageProps = { searchParams: Promise<{ filter?: string }> };

export default async function AdminBuyersPage({ searchParams }: AdminBuyersPageProps) {
  const user = await requireOwner("/admin/buyers");
  const buyerRequests = await getBuyerRequests();
  const { filter } = await searchParams;
  const initialFilter = filter === "attention" ? "attention" : "all";

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><p className="section-kicker">Rich Asset Property</p><h1>ผู้ซื้อกำลังหาทรัพย์</h1><p>เข้าสู่ระบบในชื่อ {user.displayName}</p></div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link><Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link><Link href="/admin/content">ชุดโพสต์</Link>
          <Link href="/admin/schedule">คิวคอนเทนต์</Link><Link href="/admin/reports">รายงาน</Link>
          <Link href="/">ดูเว็บไซต์</Link><a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <BuyerRequestManager initialBuyerRequests={buyerRequests} initialFilter={initialFilter} />
    </main>
  );
}
