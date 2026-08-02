import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "../../components/AdminLoginForm";
import { safeAdminReturnPath } from "../../password-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบหลังบ้าน",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<{ return_to?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { return_to: returnToValue } = await searchParams;
  const returnTo = safeAdminReturnPath(returnToValue);

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/">
          <Image
            src="/assets/brand-logo.svg"
            alt="Rich Asset Property"
            width={50}
            height={50}
            priority
          />
          <span><strong>Rich Asset Property</strong><small>OWNER WORKSPACE</small></span>
        </Link>
        <div className="admin-login-shield"><ShieldCheck aria-hidden="true" /></div>
        <p className="section-kicker">พื้นที่ทำงานส่วนตัว</p>
        <h1>เข้าสู่ระบบหลังบ้าน</h1>
        <p className="admin-login-lead">
          สำหรับนุชเพื่อจัดการลูกค้าฝากขายและข้อมูลทรัพย์เท่านั้น
        </p>
        <AdminLoginForm returnTo={returnTo} />
        <p className="admin-login-note">ระบบจะออกจากระบบอัตโนมัติภายใน 8 ชั่วโมง</p>
      </section>
    </main>
  );
}
