import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { adminSignOutPath, requireOwner } from "../../admin-auth";
import { ListingContentKit } from "../../components/ListingContentKit";
import { getManagedProperties } from "../../../db/managed-properties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชุดคอนเทนต์ประกาศ",
  robots: { index: false, follow: false },
};

type AdminContentPageProps = {
  searchParams: Promise<{ property?: string }>;
};

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const user = await requireOwner("/admin/content");
  const [properties, requestHeaders, { property }] = await Promise.all([
    getManagedProperties(true),
    headers(),
    searchParams,
  ]);
  const host = requestHeaders.get("host") ?? "rich-asset-property.richassetproperty.workers.dev";
  const protocol = requestHeaders.get("x-forwarded-proto") === "http" ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  return (
    <main className="admin-page admin-content-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Rich Asset Property</p>
          <h1>ชุดคอนเทนต์ประกาศ</h1>
          <p>เลือกทรัพย์ครั้งเดียว แล้วคัดลอกข้อความไปใช้แต่ละช่องทาง</p>
        </div>
        <nav>
          <Link href="/admin">ภาพรวมงาน</Link>
          <Link href="/admin/leads">ลูกค้าฝากขาย</Link>
          <Link href="/admin/properties">จัดการทรัพย์</Link>
          <Link href="/admin/schedule">คิวคอนเทนต์</Link>
          <Link href="/admin/reports">รายงาน</Link>
          <Link href="/">ดูเว็บไซต์</Link>
          <a href={adminSignOutPath(user)}>ออกจากระบบ</a>
        </nav>
      </header>
      <ListingContentKit
        properties={properties}
        initialPropertyId={property}
        siteUrl={siteUrl}
      />
    </main>
  );
}
