import type { Property } from "./data/properties";

export type ListingContentKit = {
  facebook: string;
  shortCaption: string;
  portal: string;
};

const contactBlock = [
  "สนใจสอบถามรายละเอียดหรือนัดชม ติดต่อ นุช",
  "โทร 061-359-1699",
  "LINE: richhouseagent99",
].join("\n");

export function createListingContentKit(
  property: Property,
  siteUrl: string,
): ListingContentKit {
  const propertyUrl = `${siteUrl.replace(/\/$/, "")}/properties/${property.id}`;
  const specs = createSpecs(property);
  const detailLines = createDetailLines(property);
  const highlights = property.highlights.map((item) => `✅ ${item}`);
  const nearby = property.nearby.map((item) => `• ${item}`);
  const hashtags = createHashtags(property);

  const facebook = compactSections([
    `🏡 ${property.title}`,
    `📍 ${property.location}\n💰 ${property.price}`,
    property.summary,
    ["รายละเอียดทรัพย์", ...detailLines].join("\n"),
    highlights.length > 0 ? ["จุดเด่น", ...highlights].join("\n") : "",
    nearby.length > 0 ? ["สถานที่ใกล้เคียง", ...nearby].join("\n") : "",
    contactBlock,
    `ดูรายละเอียดและรูปเพิ่มเติม\n${propertyUrl}`,
    hashtags,
  ]);

  const shortCaption = compactSections([
    `🏠 ${property.title}`,
    `${property.location}\nราคา ${property.price}`,
    specs.length > 0 ? specs.join(" · ") : "",
    property.highlights.slice(0, 3).map((item) => `✓ ${item}`).join("\n"),
    contactBlock,
    propertyUrl,
    hashtags,
  ]);

  const portal = compactSections([
    property.title,
    `ทำเล: ${property.location}\nราคา: ${property.price}`,
    property.summary,
    ["รายละเอียด", ...detailLines].join("\n"),
    property.highlights.length > 0
      ? ["จุดเด่น", ...property.highlights.map((item) => `- ${item}`)].join("\n")
      : "",
    property.nearby.length > 0
      ? ["สถานที่ใกล้เคียง", ...property.nearby.map((item) => `- ${item}`)].join("\n")
      : "",
    contactBlock,
    `รายละเอียดเพิ่มเติม: ${propertyUrl}`,
  ]);

  return { facebook, shortCaption, portal };
}

function createSpecs(property: Property): string[] {
  return [
    property.bedrooms > 0 ? `${property.bedrooms} ห้องนอน` : "",
    property.bathrooms > 0 ? `${property.bathrooms} ห้องน้ำ` : "",
    property.parking > 0 ? `${property.parking} ที่จอดรถ` : "",
  ].filter(Boolean);
}

function createDetailLines(property: Property): string[] {
  return [
    property.type ? `• ประเภท: ${property.type}` : "",
    property.land ? `• ขนาดที่ดิน: ${property.land}` : "",
    property.usableArea ? `• พื้นที่ใช้สอย: ${property.usableArea}` : "",
    ...createSpecs(property).map((item) => `• ${item}`),
  ].filter(Boolean);
}

function createHashtags(property: Property): string {
  const values = [
    "RichAssetProperty",
    "บ้านมือสอง",
    "อสังหาริมทรัพย์",
    toHashtag(property.type),
    toHashtag(property.location),
  ];
  return Array.from(new Set(values.filter(Boolean)))
    .map((value) => `#${value}`)
    .join(" ");
}

function toHashtag(value: string): string {
  return value.replace(/[^0-9A-Za-zก-๙]/g, "").slice(0, 36);
}

function compactSections(sections: string[]): string {
  return sections.filter((section) => section.trim()).join("\n\n");
}
