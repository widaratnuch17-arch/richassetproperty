import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: {
      default: "Rich Asset Property | บ้านมือสองที่ดูแลครบทุกขั้นตอน",
      template: "%s | Rich Asset Property",
    },
    description:
      "ซื้อ ขาย ฝาก เช่า อสังหาริมทรัพย์มือสอง นนทบุรี กรุงเทพฯ และปริมณฑล โทร 061-359-1699 LINE richhouseagent99",
    alternates: {
      canonical: "/",
    },
    keywords: [
      "Rich Asset Property",
      "บ้านมือสอง",
      "นายหน้าขายบ้าน",
      "ขายบ้านนนทบุรี",
      "ฝากขายบ้าน",
      "รับฝากขายบ้านนนทบุรี",
      "บ้านราชพฤกษ์",
      "บ้านติวานนท์",
      "บ้านแจ้งวัฒนะ",
    ],
    icons: {
      icon: "/assets/brand-logo.svg",
      shortcut: "/assets/brand-logo.svg",
    },
    openGraph: {
      type: "website",
      locale: "th_TH",
      siteName: "Rich Asset Property",
      title: "Rich Asset Property | บ้านมือสองที่ดูแลครบทุกขั้นตอน",
      description:
        "นุชดูแลตั้งแต่ประเมินราคา ทำการตลาด สินเชื่อ เอกสาร จนถึงวันโอน",
      url: baseUrl,
      images: [{ url: socialImage, width: 1731, height: 909 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Rich Asset Property",
      description: "ซื้อ ขาย ฝาก เช่า อสังหาฯ ดูแลครบทุกขั้นตอน",
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#063f8c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={ibmPlexSansThai.variable}>{children}</body>
    </html>
  );
}
