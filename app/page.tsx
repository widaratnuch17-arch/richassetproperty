import type { Metadata } from "next";
import { HomePage } from "./components/HomePage";

export const metadata: Metadata = {
  title: "Rich Asset Property | ซื้อ ขาย ฝาก เช่า อสังหาฯ",
  description:
    "บ้านมือสอง นนทบุรี กรุงเทพฯ และปริมณฑล ดูแลโดยนุช ตั้งแต่ประเมินราคา ทำการตลาด สินเชื่อ เอกสาร จนถึงวันโอน",
};

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Rich Asset Property",
    telephone: "+66-61-359-1699",
    areaServed: [
      "นนทบุรี",
      "กรุงเทพมหานคร",
      "ราชพฤกษ์",
      "ติวานนท์",
      "แจ้งวัฒนะ",
      "ปริมณฑล",
    ],
    description:
      "บริการซื้อ ขาย ฝาก เช่า บ้านมือสอง ดูแลด้านราคา การตลาด สินเชื่อ เอกสาร และวันโอน",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomePage />
    </>
  );
}
