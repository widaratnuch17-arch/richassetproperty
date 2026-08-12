export type PropertyStatus = "active" | "reserved" | "sold" | "hidden";

export type Property = {
  id: string;
  type: string;
  title: string;
  location: string;
  price: string;
  land: string;
  usableArea: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  summary: string;
  highlights: string[];
  nearby: string[];
  map: string;
  images: string[];
  status?: PropertyStatus;
  visible?: boolean;
};

export const propertyDetails: Property[] = [
  {
    id: "baanfah",
    type: "บ้านแฝด",
    title: "บ้านฟ้ากรีนพาร์ค รังสิตคลอง 3",
    location: "บึงยี่โถ ธัญบุรี ปทุมธานี",
    price: "2,390,000 บาท",
    land: "36.7 ตร.ว.",
    usableArea: "154 ตร.ม.",
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    summary:
      "บ้านแฝดสไตล์บ้านเดี่ยว 2 ชั้น หน้าบ้านทิศเหนือ พร้อมส่วนกลางและระบบรักษาความปลอดภัย",
    highlights: [
      "1 ห้องโถง 1 ห้องครัว",
      "สวนสาธารณะ สระว่ายน้ำ และฟิตเนส",
      "ระบบคีย์การ์ด CCTV และ รปภ. 24 ชม.",
      "เดินทางเชื่อมถนนรังสิต–นครนายกและวงแหวนตะวันออก",
    ],
    nearby: [
      "ฟิวเจอร์พาร์ค รังสิต",
      "ZPELL",
      "ดรีมเวิลด์",
      "โรงพยาบาลเปาโลรังสิต",
    ],
    map: "https://maps.app.goo.gl/AESRb2o2AMePZSJKA",
    images: [
      "/assets/property-baanfah-cover.jpg",
      "/assets/property-baanfah-room.jpg",
      "/assets/property-baanfah-2.jpg",
      "/assets/property-baanfah-3.jpg",
    ],
    status: "active",
  },
  {
    id: "mirth",
    type: "ทาวน์โฮม",
    title: "The Mirth Lite เพชรเกษม 63",
    location: "หลักสอง บางแค กรุงเทพมหานคร",
    price: "4,690,000 บาท",
    land: "22.10 ตร.ว.",
    usableArea: "180 ตร.ม.",
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    summary:
      "ทาวน์โฮม 3 ชั้น หน้าสวน ซอยแรกของโครงการ ห้องนั่งเล่นเพดานสูงและพร้อมเข้าอยู่",
    highlights: [
      "ห้องนั่งเล่น Double Volume สูง 6.3 เมตร",
      "เฟอร์นิเจอร์ Built-in แอร์ 4 เครื่อง",
      "ต่อเติมครัว พร้อมปั๊มน้ำและแทงก์น้ำ",
      "ใกล้ MRT หลักสอง และเดอะมอลล์บางแค",
    ],
    nearby: [
      "MRT หลักสอง",
      "เดอะมอลล์บางแค",
      "ซีคอนบางแค",
      "โรงพยาบาลเกษมราษฎร์",
    ],
    map: "https://maps.app.goo.gl/y7fgzLuRCCYiJnBT7",
    images: [
      "/assets/property-mirth-cover.jpg",
      "/assets/property-mirth-carport.png",
      "/assets/property-mirth-2.png",
      "/assets/property-mirth-3.png",
    ],
    status: "active",
  },
  {
    id: "jgrand",
    type: "ทาวน์โฮม",
    title: "J GRAND สาทร–กัลปพฤกษ์",
    location: "กัลปพฤกษ์ บางแค กรุงเทพมหานคร",
    price: "3,999,000 บาท",
    land: "18.5 ตร.ว.",
    usableArea: "161 ตร.ม.",
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    summary:
      "ทาวน์โฮม 3 ชั้น หน้าบ้านไม่ชนใคร ติดถนนใหญ่กัลปพฤกษ์ เดินทางเข้าสาทรสะดวก",
    highlights: [
      "ครัว Built-in พร้อมใช้งาน",
      "ต่อเติมหลังคาจอดรถและพื้นที่ซักล้าง",
      "แอร์ 5 เครื่อง พร้อมผ้าม่าน ปั๊มน้ำและแทงก์น้ำ",
      "สระว่ายน้ำ ฟิตเนส Key Card และ รปภ. 24 ชม.",
    ],
    nearby: [
      "MRT สายสีน้ำเงิน",
      "BTS วุฒากาศ",
      "เดอะมอลล์บางแค",
      "เซ็นทรัลพระราม 2",
    ],
    map: "https://maps.app.goo.gl/YDLdaLFPpf4niF4a9",
    images: [
      "/assets/property-jgrand-cover.jpg",
      "/assets/property-jgrand-room.jpg",
      "/assets/property-jgrand-2.jpg",
      "/assets/property-jgrand-3.jpg",
    ],
    status: "active",
  },
];

export function getProperty(slug: string) {
  return propertyDetails.find((property) => property.id === slug);
}
