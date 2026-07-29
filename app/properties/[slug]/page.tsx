import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CarFront,
  Check,
  ExternalLink,
  LandPlot,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyShareButton } from "../../components/PropertyShareButton";
import { getManagedProperties, getManagedProperty } from "../../../db/managed-properties";

const PHONE = "061-359-1699";
const LINE_URL = "https://line.me/ti/p/~richhouseagent99";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getManagedProperty(slug);

  if (!property || property.status === "hidden") return {};

  return {
    title: `${property.title} | ${property.price}`,
    description: `${property.summary} ทำเล ${property.location} ราคา ${property.price} นัดชมกับนุช Rich Asset Property`,
    alternates: {
      canonical: `/properties/${property.id}`,
    },
    openGraph: {
      type: "website",
      locale: "th_TH",
      title: `${property.title} | ${property.price}`,
      description: property.summary,
      images: [{ url: property.images[0] }],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = await getManagedProperty(slug);

  if (!property || property.status === "hidden") notFound();

  const relatedProperties = (await getManagedProperties()).filter((item) => item.id !== property.id);

  return (
    <main className="property-detail-page">
      <header className="property-detail-header">
        <Link className="property-detail-brand" href="/">
          <Image src="/assets/brand-logo.svg" alt="Rich Asset Property" width={54} height={54} />
          <span><strong>Rich Asset</strong><small>Property</small></span>
        </Link>
        <Link className="property-detail-back" href="/#properties">
          <ArrowLeft /> กลับไปดูทรัพย์ทั้งหมด
        </Link>
      </header>

      <section className="property-detail-hero">
        <div className="property-detail-title">
          <div>
            <p className="section-kicker">
              {property.type} · {property.status === "sold" ? "ขายแล้ว" : property.status === "reserved" ? "ติดจอง" : "พร้อมขาย"}
            </p>
            <h1>{property.title}</h1>
            <p className="property-detail-location"><MapPin /> {property.location}</p>
          </div>
          <div className="property-detail-price">
            <small>ราคาขาย</small>
            <strong>{property.price}</strong>
            <PropertyShareButton title={property.title} />
          </div>
        </div>

        <div className="property-detail-gallery">
          {property.images.map((image, index) => (
            <div className={index === 0 ? "property-gallery-main" : "property-gallery-small"} key={image}>
              <Image
                src={image}
                alt={`${property.title} ภาพที่ ${index + 1}`}
                fill
                priority={index === 0}
                sizes={index === 0 ? "(max-width: 820px) 100vw, 62vw" : "(max-width: 820px) 33vw, 19vw"}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="property-detail-content">
        <div className="property-detail-main">
          <div className="property-detail-specs">
            <div><LandPlot /><span><small>ขนาดที่ดิน</small><strong>{property.land}</strong></span></div>
            <div><Ruler /><span><small>พื้นที่ใช้สอย</small><strong>{property.usableArea}</strong></span></div>
            <div><BedDouble /><span><small>ห้องนอน</small><strong>{property.bedrooms} ห้อง</strong></span></div>
            <div><Bath /><span><small>ห้องน้ำ</small><strong>{property.bathrooms} ห้อง</strong></span></div>
            <div><CarFront /><span><small>ที่จอดรถ</small><strong>{property.parking} คัน</strong></span></div>
          </div>

          <div className="property-detail-copy">
            <section>
              <p className="section-kicker">รายละเอียดทรัพย์</p>
              <h2>บ้านที่พร้อมให้คุณ<br />นัดชมรายละเอียดจริง</h2>
              <p className="property-detail-summary">{property.summary}</p>
            </section>

            <section className="property-detail-list">
              <h3>จุดเด่นของบ้าน</h3>
              <ul>
                {property.highlights.map((highlight) => (
                  <li key={highlight}><Check /> {highlight}</li>
                ))}
              </ul>
            </section>

            <section className="property-detail-list">
              <h3>สถานที่ใกล้เคียง</h3>
              <ul>
                {property.nearby.map((place) => (
                  <li key={place}><MapPin /> {place}</li>
                ))}
              </ul>
              <a className="property-map-link" href={property.map} target="_blank" rel="noreferrer">
                เปิดดูทำเลบน Google Maps <ExternalLink />
              </a>
            </section>
          </div>
        </div>

        <aside className="property-contact-card">
          <p className="section-kicker">สนใจบ้านหลังนี้</p>
          <h2>คุยกับนุช<br />ก่อนนัดชม</h2>
          <p>
            สอบถามสถานะล่าสุด รายละเอียดเพิ่มเติม นัดชมบ้าน
            หรือปรึกษาความพร้อมด้านสินเชื่อได้โดยตรง
          </p>
          <a className="button button--primary" href={LINE_URL} target="_blank" rel="noreferrer">
            <MessageCircle /> สอบถามทาง LINE
          </a>
          <a className="button button--ghost" href={`tel:${PHONE.replaceAll("-", "")}`}>
            <Phone /> {PHONE}
          </a>
          <small>แจ้งชื่อโครงการหรือส่งลิงก์หน้านี้ให้นุชได้เลย</small>
        </aside>
      </section>

      <section className="related-properties">
        <div className="related-properties-head">
          <div>
            <p className="section-kicker">ทรัพย์อื่นที่น่าสนใจ</p>
            <h2>ดูบ้านเพิ่มเติม</h2>
          </div>
          <Link href="/#properties">ดูทรัพย์ทั้งหมด <ArrowRight /></Link>
        </div>
        <div className="related-properties-grid">
          {relatedProperties.map((item) => (
            <Link className="related-property-card" href={`/properties/${item.id}`} key={item.id}>
              <span className="related-property-image">
                <Image src={item.images[0]} alt={item.title} fill sizes="(max-width: 700px) 92vw, 44vw" />
              </span>
              <span className="related-property-copy">
                <small>{item.location}</small>
                <strong>{item.title}</strong>
                <b>{item.price}</b>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="property-detail-footer">
        <Image src="/assets/brand-logo.svg" alt="Rich Asset Property" width={72} height={72} />
        <p>Rich Asset Property · โทร {PHONE} · LINE richhouseagent99</p>
        <Link href="/">กลับหน้าแรก</Link>
      </footer>
    </main>
  );
}
