import type { Metadata } from "next";
import { HomePage } from "./components/HomePage";
import { getManagedProperties } from "../db/managed-properties";

const SITE_URL = "https://rich-asset-property.richassetproperty.workers.dev";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rich Asset Property | ซื้อ ขาย ฝาก เช่า อสังหาฯ",
  description:
    "บ้านมือสอง นนทบุรี กรุงเทพฯ และปริมณฑล ดูแลโดยนุช ตั้งแต่ประเมินราคา ทำการตลาด สินเชื่อ เอกสาร จนถึงวันโอน",
};

export default async function Home() {
  const properties = await getManagedProperties();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Rich Asset Property",
        inLanguage: "th-TH",
        description:
          "เว็บไซต์บ้านมือสองและบริการรับฝากขายบ้านในนนทบุรี กรุงเทพฯ และปริมณฑล",
      },
      {
        "@type": "RealEstateAgent",
        "@id": `${SITE_URL}/#business`,
        name: "Rich Asset Property",
        url: SITE_URL,
        logo: `${SITE_URL}/assets/brand-logo.jpg`,
        image: `${SITE_URL}/og.png`,
        telephone: "+66-61-359-1699",
        description:
          "บริการซื้อ ขาย และรับฝากขายบ้านมือสอง ดูแลด้านราคา การตลาด สินเชื่อ เอกสาร และวันโอนโดยนุช",
        areaServed: [
          "นนทบุรี",
          "กรุงเทพมหานคร",
          "ราชพฤกษ์",
          "ติวานนท์",
          "แจ้งวัฒนะ",
          "ปริมณฑล",
        ],
        knowsAbout: [
          "บ้านมือสอง",
          "การประเมินราคาขาย",
          "การตลาดอสังหาริมทรัพย์",
          "สินเชื่อบ้าน",
          "เอกสารซื้อขายอสังหาริมทรัพย์",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+66-61-359-1699",
          contactType: "customer service",
          availableLanguage: ["Thai"],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomePage initialProperties={properties} />
    </>
  );
}
