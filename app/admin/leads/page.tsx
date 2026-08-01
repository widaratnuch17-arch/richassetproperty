import type { Metadata } from "next";
import Link from "next/link";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { LeadManager } from "../../components/LeadManager";
import { getListingLeads } from "../../../db/listing-leads";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ลูกค้าฝากขาย",
  robots: { index: false, follow: false },
};

type AdminLeadsPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const user = await requireOwner("/admin/leads");
  const leads = await getListingLeads();
  const { filter } = await searchParams;
  const initialFilter = filter === "attention" ? "attention" : "all";

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>ลูกค้าฝากขาย</h1>
          <p>เข้าสู่ระบบในชื่อ {user.displayName}</p>
        </div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <LeadManager initialLeads={leads} initialFilter={initialFilter} />
    </main>
  );
}
