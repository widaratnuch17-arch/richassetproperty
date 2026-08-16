"use client";

import {
  ArrowDown,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CarFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  House,
  KeyRound,
  LandPlot,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingLeadForm } from "./ListingLeadForm";

const PHONE = "061-359-1699";
const LINE_ID = "richhouseagent99";
const LINE_URL = "https://line.me/ti/p/~richhouseagent99";

type Property = {
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
  status?: "active" | "reserved" | "sold" | "hidden";
};

const propertyStatusLabels = {
  active: "พร้อมขาย",
  reserved: "ติดจอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อนรายการ",
} as const;

const properties: Property[] = [
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
  },
];

const services = [
  {
    number: "01",
    title: "วิเคราะห์ราคาตลาด",
    text: "ศึกษาทรัพย์เปรียบเทียบและแนะนำราคาตั้งขายที่เหมาะกับสภาพและทำเล",
    icon: Search,
  },
  {
    number: "02",
    title: "เตรียมสื่อให้ทรัพย์น่าสนใจ",
    text: "ถ่ายภาพ เขียนประกาศ ทำคอนเทนต์และคลิปรีวิวให้เห็นจุดเด่นได้เร็ว",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "ทำการตลาดครบช่องทาง",
    text: "กระจายประกาศและวางแผนโฆษณาโดยไม่มีค่าใช้จ่ายล่วงหน้าจนกว่าจะขายได้",
    icon: Building2,
  },
  {
    number: "04",
    title: "คัดกรองผู้ซื้อและสินเชื่อ",
    text: "ตรวจสอบความพร้อมของผู้สนใจ นัดชม และช่วยประสานการยื่นสินเชื่อ",
    icon: ShieldCheck,
  },
  {
    number: "05",
    title: "ดูแลสัญญาจนถึงวันโอน",
    text: "เตรียมเอกสาร ประเมินค่าใช้จ่าย และประสานทุกฝ่ายจนการขายสำเร็จ",
    icon: FileCheck2,
  },
];

const faqs = [
  {
    q: "รับฝากขายทรัพย์ประเภทใดและพื้นที่ไหนบ้าง?",
    a: "รับบ้านเดี่ยว บ้านแฝด ทาวน์โฮม คอนโด และที่ดิน โดยเน้นนนทบุรี กรุงเทพฯ และปริมณฑล โดยเฉพาะราชพฤกษ์ ติวานนท์ และแจ้งวัฒนะ",
  },
  {
    q: "มีค่าใช้จ่ายการตลาดล่วงหน้าหรือไม่?",
    a: "ไม่มีค่าใช้จ่ายการตลาดล่วงหน้า นุชทำการตลาดให้และรับค่าคอมมิชชัน 3% จากราคาขายจริงเมื่อขายสำเร็จ หากขายไม่ได้ เจ้าของทรัพย์ไม่มีค่าใช้จ่าย",
  },
  {
    q: "ทำไมจึงใช้สัญญาฝากขายแบบปิด 6 เดือน?",
    a: "เพื่อให้นุชวางแผนราคา ลงทุนทำสื่อและทำการตลาดได้อย่างเต็มที่ รวมถึงควบคุมข้อมูล ราคา และการนัดชมให้เป็นระบบเดียวกัน",
  },
  {
    q: "บ้านติดจำนองยังขายได้หรือไม่?",
    a: "โดยทั่วไปสามารถวางแผนการขายได้ แต่ต้องตรวจสอบยอดหนี้ เอกสารกรรมสิทธิ์ และเงื่อนไขของแต่ละเคสก่อน นุชจะช่วยประสานขั้นตอนที่เกี่ยวข้อง",
  },
  {
    q: "ช่วยผู้ซื้อยื่นสินเชื่อด้วยไหม?",
    a: "นุชช่วยคัดกรองความพร้อมเบื้องต้นและประสานการยื่นสินเชื่อ เพื่อให้ผู้ซื้อและผู้ขายเห็นแนวทางที่ชัดเจนก่อนเดินหน้าสัญญา",
  },
  {
    q: "เริ่มฝากขายต้องเตรียมอะไรบ้าง?",
    a: "เริ่มจากส่งประเภททรัพย์ ทำเล ขนาด ราคาที่ต้องการขาย รูปถ่ายเบื้องต้น และข้อมูลภาระจำนองถ้ามี ผ่าน LINE เพื่อให้นุชประเมินแนวทางเบื้องต้นก่อน",
  },
];

const navItems = [
  { label: "ทรัพย์เด่น", href: "#properties" },
  { label: "ฝากขาย", href: "#sell" },
  { label: "บริการ", href: "#services" },
  { label: "ผลงาน", href: "#success" },
  { label: "เกี่ยวกับนุช", href: "#about" },
];

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.988, filter: "blur(6px)" }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ContactButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`contact-buttons ${compact ? "contact-buttons--compact" : ""}`}>
      <a className="button button--primary" href={LINE_URL} target="_blank" rel="noreferrer">
        <MessageCircle size={19} aria-hidden />
        ปรึกษาทาง LINE
      </a>
      <a className="button button--ghost" href={`tel:${PHONE.replaceAll("-", "")}`}>
        <Phone size={18} aria-hidden />
        {PHONE}
      </a>
    </div>
  );
}

function PropertyModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const moveImage = (direction: number) => {
    setActiveImage(
      (current) =>
        (current + direction + property.images.length) % property.images.length,
    );
  };

  return (
    <motion.div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
      aria-describedby="property-modal-summary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        className="property-modal"
        initial={{ opacity: 0, scale: 0.97, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        <button
          ref={closeButtonRef}
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="ปิดรายละเอียดทรัพย์"
        >
          <X size={22} />
        </button>

        <div className="modal-gallery">
          <Image
            src={property.images[activeImage]}
            alt={`${property.title} ภาพที่ ${activeImage + 1}`}
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
          />
          {property.images.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-nav gallery-nav--left"
                onClick={() => moveImage(-1)}
                aria-label="ภาพก่อนหน้า"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="gallery-nav gallery-nav--right"
                onClick={() => moveImage(1)}
                aria-label="ภาพถัดไป"
              >
                <ChevronRight />
              </button>
            </>
          )}
          <span className="gallery-count">
            {activeImage + 1} / {property.images.length}
          </span>
        </div>

        <div className="modal-content">
          <div className="property-kicker">
            <span>{property.type}</span>
            <span className="dot" />
            <span>{propertyStatusLabels[property.status ?? "active"]}</span>
          </div>
          <h2 id="property-modal-title">{property.title}</h2>
          <p className="location-line">
            <MapPin size={17} />
            {property.location}
          </p>
          <p className="modal-price">{property.price}</p>
          <div className="modal-specs">
            <span><LandPlot /> {property.land}</span>
            <span><Ruler /> {property.usableArea}</span>
            <span><BedDouble /> {property.bedrooms} ห้องนอน</span>
            <span><Bath /> {property.bathrooms} ห้องน้ำ</span>
            <span><CarFront /> {property.parking} ที่จอดรถ</span>
          </div>
          <p className="modal-summary" id="property-modal-summary">{property.summary}</p>
          <div className="modal-lists">
            <div>
              <h3>จุดเด่น</h3>
              <ul>
                {property.highlights.map((item) => (
                  <li key={item}><Check size={16} />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>สถานที่ใกล้เคียง</h3>
              <ul>
                {property.nearby.map((item) => (
                  <li key={item}><MapPin size={16} />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="modal-actions">
            <a className="button button--primary" href={LINE_URL} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              นัดชมทรัพย์
            </a>
            <a className="button button--ghost" href={property.map} target="_blank" rel="noreferrer">
              <MapPin size={18} />
              เปิดแผนที่
            </a>
          </div>
          <Link className="modal-page-link" href={`/properties/${property.id}`}>
            เปิดหน้ารายละเอียดสำหรับแชร์ <ArrowRight />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HomePage({ initialProperties = properties }: { initialProperties?: Property[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<string>("ทั้งหมด");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.28 });
  const heroCopyY = useTransform(scrollYProgress, [0, 0.18], [0, reduceMotion ? 0 : -28]);

  const propertyTypes = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(initialProperties.map((property) => property.type)))],
    [initialProperties],
  );

  const filteredProperties = useMemo(
    () =>
      filter === "ทั้งหมด"
        ? initialProperties
        : initialProperties.filter((property) => property.type === filter),
    [filter, initialProperties],
  );

  const closeProperty = useCallback(() => setSelectedProperty(null), []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("keydown", closeMenu);
    return () => document.removeEventListener("keydown", closeMenu);
  }, [menuOpen]);

  return (
    <main>
      <motion.div className="page-progress" style={{ scaleX: smoothProgress }} aria-hidden="true" />
      <a className="skip-link" href="#main-content">ข้ามไปยังเนื้อหาหลัก</a>

      <motion.header
        className="site-header"
        initial={reduceMotion ? false : { opacity: 0, y: -22, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <a className="brand" href="#top" aria-label="Rich Asset Property หน้าแรก">
          <Image
            src="/assets/brand-logo.svg"
            alt="Rich Asset Property"
            width={96}
            height={96}
            priority
          />
          <span>
            <strong>RICH ASSET</strong>
            <small>PROPERTY</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="เมนูหลัก">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <a className="header-line" href="#listing-form">
          <FileCheck2 size={18} />
          ประเมินฝากขาย
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          className="menu-button"
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-navigation"
              className="mobile-nav"
              aria-label="เมนูมือถือ"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}<ArrowRight size={17} />
                </a>
              ))}
              <a href="#listing-form" onClick={() => setMenuOpen(false)}>
                ประเมินฝากขาย<ArrowRight size={17} />
              </a>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <section className="hero hero--cinematic" id="top">
        <motion.div
          className="hero-cinematic-media"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.045 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <Image
            src="/assets/hero-rich-asset-v2.png"
            alt=""
            fill
            sizes="100vw"
            priority
          />
        </motion.div>
        <div className="hero-cinematic-shade" aria-hidden="true" />
        <div className="hero-cinematic-grid" aria-hidden="true" />
        <div className="hero-content" id="main-content">
          <motion.div
            className="hero-copy"
            style={{ y: heroCopyY }}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">
              <span />
              ซื้อ • ขาย • ฝาก • เช่า อสังหาริมทรัพย์
            </p>
            <h1>
              <span className="hero-title-line">ซื้อ–ขายบ้าน</span>
              <span className="hero-title-line hero-title-line--accent">อย่างมั่นใจ</span>
              <span className="hero-title-line hero-title-line--closing">ทุกขั้นตอน</span>
            </h1>
            <p className="hero-lead">
              เลือกบ้านด้วยข้อมูลที่ชัดเจน หรือฝากขายกับนุชคนเดียวที่ดูแล
              ตั้งแต่ประเมินราคา ทำการตลาด สินเชื่อ เอกสาร จนถึงวันโอน
            </p>
            <ContactButtons />
            <div className="hero-points" aria-label="จุดเด่นบริการ">
              <span><Check /> ไม่มีค่าใช้จ่ายล่วงหน้า</span>
              <span><Check /> ดูแลเองทุกเคส</span>
            </div>
          </motion.div>
        </div>
        <p className="hero-cinematic-signature" aria-hidden="true">
          RICH ASSET PROPERTY <span /> NONTHABURI · BANGKOK
        </p>
        <a className="scroll-cue" href="#properties">
          ดูทรัพย์เด่น
          <ArrowDown size={17} />
        </a>
      </section>

      <section className="trust-strip motion-section" aria-label="ข้อเสนอรับฝากขาย">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.03 }}
        >
          <span>01</span>
          <p><strong>0 บาท</strong><small>ค่าใช้จ่ายการตลาดล่วงหน้า</small></p>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.09 }}
        >
          <span>02</span>
          <p><strong>3%</strong><small>ค่าคอมมิชชันเมื่อขายสำเร็จ</small></p>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <span>03</span>
          <p><strong>6 เดือน</strong><small>สัญญาฝากขายแบบปิด</small></p>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.21 }}
        >
          <span>04</span>
          <p><strong>ครบวงจร</strong><small>ราคา การตลาด สินเชื่อ เอกสาร</small></p>
        </motion.div>
      </section>

      <section className="audience-section motion-section" aria-labelledby="audience-title">
        <FadeUp className="audience-heading">
          <p className="section-kicker">เริ่มจากสิ่งที่คุณต้องการ</p>
          <h2 id="audience-title">วันนี้คุณกำลัง<br />มองหาอะไร?</h2>
        </FadeUp>

        <div className="audience-grid">
          <FadeUp className="audience-card audience-card--buyer" delay={0.05}>
            <span className="audience-icon"><House /></span>
            <p className="audience-label">สำหรับผู้ซื้อ</p>
            <h3>กำลังหาซื้อบ้าน</h3>
            <p>ดูทรัพย์ที่คัดข้อมูลสำคัญไว้ครบ แล้วทักนุชเพื่อนัดชมและคุยเรื่องสินเชื่อได้ทันที</p>
            <a href="#properties">ดูทรัพย์ที่น่าสนใจ <ArrowRight /></a>
          </FadeUp>
          <FadeUp className="audience-card audience-card--seller" delay={0.1}>
            <span className="audience-icon"><KeyRound /></span>
            <p className="audience-label">สำหรับเจ้าของทรัพย์</p>
            <h3>ต้องการขายบ้าน</h3>
            <p>เริ่มจากประเมินแนวทาง ราคา และแผนการตลาด โดยไม่มีค่าใช้จ่ายล่วงหน้า</p>
            <a href="#sell">ดูขั้นตอนฝากขาย <ArrowRight /></a>
          </FadeUp>
        </div>

        <FadeUp className="expertise-band" delay={0.12}>
          <div>
            <p>ทำเลที่นุชโฟกัส</p>
            <div className="area-chips" aria-label="พื้นที่ให้บริการหลัก">
              <span>นนทบุรี</span>
              <span>ราชพฤกษ์</span>
              <span>ติวานนท์</span>
              <span>แจ้งวัฒนะ</span>
            </div>
          </div>
          <p className="expertise-note">
            <LandPlot />
            เชี่ยวชาญบ้านเดี่ยวราคาต่ำกว่า 10 ล้านบาท
          </p>
        </FadeUp>
      </section>

      <section className="section properties-section motion-section" id="properties">
        <FadeUp className="section-heading-row">
          <div>
            <p className="section-kicker">ทรัพย์คัดสรร</p>
            <h2>ทรัพย์เด่น<br />ที่น่าสนใจ</h2>
          </div>
          <p className="section-intro">
            ทุกหลังแสดงข้อมูลสำคัญที่ตรวจสอบแล้วให้เห็นง่าย
            หากสนใจสามารถทักนุชเพื่อเช็กสถานะ นัดชม และคุยเรื่องสินเชื่อได้เลย
          </p>
        </FadeUp>

        <div className="property-filter-toolbar">
          <div className="filter-row" role="group" aria-label="กรองประเภททรัพย์">
            {propertyTypes.map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                aria-pressed={filter === item}
                aria-controls="property-results"
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="filter-result" aria-live="polite">
            พบ {filteredProperties.length} รายการ
          </p>
        </div>

        <motion.div className="property-grid" id="property-results" layout>
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((property, index) => (
              <motion.article
                className="property-card"
                key={property.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97, rotateX: 4 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                exit={{ opacity: 0, scale: 0.98 }}
                whileHover={reduceMotion ? undefined : { y: -10, scale: 1.012, rotateX: 1.2 }}
                transition={{ duration: 0.52, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 1200 }}
              >
                <button
                  type="button"
                  className="property-image"
                  onClick={() => setSelectedProperty(property)}
                  aria-label={`ดูรายละเอียด ${property.title}`}
                >
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    sizes="(max-width: 760px) 92vw, (max-width: 1100px) 44vw, 31vw"
                  />
                  <span className="property-type">{property.type}</span>
                  {property.status && property.status !== "active" && (
                    <span className="property-status" data-status={property.status}>
                      {propertyStatusLabels[property.status]}
                    </span>
                  )}
                  <span className="image-arrow"><ArrowRight /></span>
                </button>
                <div className="property-body">
                  <p className="property-location"><MapPin />{property.location}</p>
                  <h3>{property.title}</h3>
                  <p className="property-price">{property.price}</p>
                  <div className="property-specs">
                    <span><LandPlot />{property.land}</span>
                    <span><BedDouble />{property.bedrooms}</span>
                    <span><Bath />{property.bathrooms}</span>
                    <span><CarFront />{property.parking}</span>
                  </div>
                  <Link className="text-link" href={`/properties/${property.id}`}>
                    ดูรายละเอียดทั้งหมด <ArrowRight size={17} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          {filteredProperties.length === 0 && (
            <div className="property-empty" role="status">
              <Search aria-hidden />
              <strong>ยังไม่มีทรัพย์ประเภทนี้ในขณะนี้</strong>
              <span>ทัก LINE เพื่อให้นุชช่วยค้นหาทรัพย์ที่ตรงกับความต้องการได้เลย</span>
              <a href={LINE_URL} target="_blank" rel="noreferrer">แจ้งทรัพย์ที่กำลังมองหา</a>
            </div>
          )}
        </motion.div>
      </section>

      <section className="buyer-support-section motion-section" id="buyer-support">
        <FadeUp className="buyer-support-copy">
          <p className="section-kicker section-kicker--light">สำหรับผู้ซื้อ</p>
          <h2>เห็นข้อมูลสำคัญ<br />ก่อนตัดสินใจ</h2>
          <p>
            บ้านที่ใช่ไม่ได้ดูแค่รูปสวย นุชช่วยให้คุณเห็นข้อมูลของตัวทรัพย์
            ความพร้อมด้านสินเชื่อ และขั้นตอนที่ต้องวางแผนก่อนเดินหน้าซื้อ
          </p>
          <a className="buyer-support-cta" href={LINE_URL} target="_blank" rel="noreferrer">
            <MessageCircle /> บอกนุชว่ากำลังมองหาบ้านแบบไหน
          </a>
        </FadeUp>

        <div className="buyer-support-list">
          <FadeUp delay={0.04}>
            <span><Search /></span>
            <p><strong>เช็กข้อมูลก่อนนัดชม</strong><small>ราคา ทำเล ขนาด และรายละเอียดสำคัญของทรัพย์</small></p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <span><ShieldCheck /></span>
            <p><strong>วางแนวทางสินเชื่อ</strong><small>คุยความพร้อมเบื้องต้นก่อนตัดสินใจทำสัญญา</small></p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <span><FileCheck2 /></span>
            <p><strong>เข้าใจขั้นตอนและเอกสาร</strong><small>เห็นภาพกระบวนการตั้งแต่เจรจาจนถึงวันโอน</small></p>
          </FadeUp>
        </div>
      </section>

      <section className="about-section motion-section" id="about">
        <motion.div
          className="about-image-wrap"
          initial={reduceMotion ? false : { opacity: 0, x: -46, scale: 0.95, rotateY: -5 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, scale: 1, rotateY: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1200 }}
        >
          <div className="about-image">
            <Image
              src="/assets/nuch-about.svg"
              alt="นุช Rich Asset Property"
              fill
              sizes="(max-width: 900px) 92vw, 44vw"
            />
          </div>
          <div className="about-caption">
            <House />
            <span>นุช<br /><strong>Rich Asset Property</strong></span>
          </div>
        </motion.div>
        <FadeUp className="about-copy">
          <p className="section-kicker section-kicker--light">รู้จักนุช</p>
          <h2>ดูแลเอง<br className="mobile-break" />ทุกเคส</h2>
          <p className="about-lead">
            นุชเชื่อว่าการซื้อ–ขายบ้านต้องเริ่มจากข้อมูลที่ตรงไปตรงมา
            จึงดูแลเองทุกเคส ตั้งแต่ราคา การตลาด ผู้ซื้อ สินเชื่อ เอกสาร
            และค่าใช้จ่าย เพื่อให้คุณตัดสินใจได้อย่างมั่นใจ
          </p>
          <div className="about-values">
            <div><ShieldCheck /><span><strong>ตรงไปตรงมา</strong><small>ข้อมูลชัดเจน ไม่กล่าวอ้างเกินจริง</small></span></div>
            <div><FileCheck2 /><span><strong>ทำงานเป็นระบบ</strong><small>ติดตามทุกขั้นตอนจนถึงวันโอน</small></span></div>
            <div><MessageCircle /><span><strong>คุยง่ายและรายงานผล</strong><small>เจ้าของทรัพย์รู้ความคืบหน้าเสมอ</small></span></div>
          </div>
          <ContactButtons compact />
        </FadeUp>
      </section>

      <section className="section services-section motion-section" id="services">
        <FadeUp className="services-title">
          <p className="section-kicker">ขั้นตอนการทำงาน</p>
          <h2>หนึ่งคนดูแล<br />ครบทุกขั้นตอน</h2>
        </FadeUp>
        <div className="service-list">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <FadeUp className="service-row" delay={index * 0.05} key={service.number}>
                <span className="service-number">{service.number}</span>
                <span className="service-icon"><Icon /></span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
        <div className="service-gallery">
          {["service-2.jpg", "service-3.jpg", "service-4.jpg"].map((image, index) => (
            <FadeUp className="service-photo" delay={index * 0.08} key={image}>
              <Image
                src={`/assets/${image}`}
                alt={`ภาพการดูแลลูกค้าและการดำเนินงาน ภาพที่ ${index + 1}`}
                fill
                sizes="(max-width: 760px) 88vw, 30vw"
              />
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="success-section motion-section" id="success">
        <div className="success-head">
          <FadeUp>
            <p className="section-kicker section-kicker--light">ผลงานจริง</p>
            <h2>จากวันเริ่มขาย<br />ถึงวันส่งมอบ</h2>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p>
              ภาพจริงส่วนหนึ่งจากการทำสัญญาและวันโอน
              เบื้องหลังทุกภาพคือการประสานงานที่ต้องชัดเจนและรอบคอบ
            </p>
          </FadeUp>
        </div>
        <div className="success-track">
          {["success-1.jpg", "success-2.jpg", "success-3.jpg", "success-4.jpg", "success-5.jpg"].map(
            (image, index) => (
              <motion.div
                className={`success-card success-card--${(index % 3) + 1}`}
                key={image}
                initial={reduceMotion ? false : { opacity: 0, y: 34 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                whileHover={reduceMotion ? undefined : { y: -12, scale: 1.025, rotateZ: index % 2 === 0 ? -0.7 : 0.7 }}
                transition={{ duration: 0.6, delay: index * 0.06 }}
              >
                <Image
                  src={`/assets/${image}`}
                  alt={`ผลงานดูแลลูกค้าจนถึงวันโอน ภาพที่ ${index + 1}`}
                  fill
                  sizes="(max-width: 760px) 76vw, 25vw"
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </motion.div>
            ),
          )}
        </div>
      </section>

      <section className="seller-section motion-section" id="sell">
        <div className="seller-card">
          <FadeUp>
            <p className="section-kicker">สำหรับเจ้าของทรัพย์</p>
            <h2>มีบ้านต้องการขาย<br />แต่ไม่รู้เริ่มตรงไหน?</h2>
            <p className="seller-lead">
              ส่งข้อมูลทรัพย์ให้นุชประเมินแนวทางเบื้องต้น
              พร้อมคุยเรื่องราคา แผนการตลาดและขั้นตอนอย่างตรงไปตรงมา
            </p>
            <div className="seller-assurance">
              <Check /> ไม่มีค่าใช้จ่ายการตลาดล่วงหน้า • ค่าคอมมิชชัน 3% เมื่อขายสำเร็จ
            </div>
          </FadeUp>
          <FadeUp className="seller-offer" delay={0.08}>
            <div><span>01</span><p><strong>ส่งข้อมูลเบื้องต้น</strong><small>ทำเล ประเภททรัพย์ ขนาด ราคาที่ต้องการ และรูปถ่าย</small></p></div>
            <div><span>02</span><p><strong>คุยราคาและวางแผน</strong><small>ประเมินแนวทางการขาย ค่าใช้จ่าย และแผนการตลาดให้ชัดเจน</small></p></div>
            <div><span>03</span><p><strong>เริ่มทำตลาดเมื่อพร้อม</strong><small>นุชดูแลสื่อ ผู้ซื้อ สินเชื่อ เอกสาร และวันโอนให้ครบ</small></p></div>
            <ContactButtons />
            <p className="seller-note">
              ไม่ต้องกรอกแบบฟอร์มยาว เริ่มจากส่งข้อมูลเบื้องต้นทาง LINE ได้เลย
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="listing-form-section motion-section" id="listing-form">
        <FadeUp className="listing-form-intro">
          <p className="section-kicker section-kicker--light">เริ่มฝากขายกับนุช</p>
          <h2>ส่งข้อมูลเบื้องต้น<br />ใช้เวลาไม่กี่นาที</h2>
          <p className="listing-form-lead">
            กรอกเท่าที่ทราบก่อนก็ได้ นุชจะใช้ข้อมูลนี้ประเมินแนวทางเบื้องต้น
            แล้วติดต่อกลับเพื่อคุยเรื่องราคา ความพร้อมของทรัพย์ และขั้นตอนถัดไป
          </p>
          <div className="listing-form-facts">
            <div><span>01</span><p><strong>ส่งข้อมูลทรัพย์</strong><small>ไม่ต้องเตรียมเอกสารครบในครั้งแรก</small></p></div>
            <div><span>02</span><p><strong>นุชติดต่อกลับ</strong><small>คุยรายละเอียดและประเมินแนวทางร่วมกัน</small></p></div>
            <div><span>03</span><p><strong>ตัดสินใจเมื่อพร้อม</strong><small>การส่งแบบฟอร์มยังไม่ถือเป็นสัญญาฝากขาย</small></p></div>
          </div>
          <p className="listing-form-contact">
            ต้องการคุยทันที? โทร <a href={`tel:${PHONE.replaceAll("-", "")}`}>{PHONE}</a>
            {" "}หรือ LINE <a href={LINE_URL} target="_blank" rel="noreferrer">{LINE_ID}</a>
          </p>
        </FadeUp>
        <FadeUp delay={0.08}>
          <ListingLeadForm />
        </FadeUp>
      </section>

      <section className="section faq-section motion-section" id="faq">
        <FadeUp className="faq-heading">
          <p className="section-kicker">ก่อนเริ่มคุยกัน</p>
          <h2>คำถามที่พบบ่อย</h2>
        </FadeUp>
        <div className="faq-list">
          {faqs.map((item, index) => (
            <FadeUp delay={index * 0.035} key={item.q}>
              <details>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.q}
                  <ChevronDown className="faq-chevron" />
                </summary>
                <p>{item.a}</p>
              </details>
            </FadeUp>
          ))}
        </div>
      </section>

      <footer className="motion-section" id="contact">
        <motion.div
          className="footer-main"
          initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.985 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/assets/brand-logo.svg"
            alt="Rich Asset Property"
            width={180}
            height={180}
          />
          <div>
            <p className="footer-eyebrow">พร้อมคุยเรื่องบ้านของคุณ</p>
            <h2>ให้เรื่องซื้อ–ขายบ้าน<br />ชัดเจนตั้งแต่วันแรก</h2>
          </div>
          <ContactButtons />
        </motion.div>
        <div className="footer-bottom">
          <p>© 2026 Rich Asset Property</p>
          <p>โทร {PHONE} · LINE {LINE_ID}</p>
          <a href="/privacy">ประกาศความเป็นส่วนตัว</a>
          <a href="#top">กลับด้านบน <ArrowDown className="up-arrow" size={15} /></a>
        </div>
      </footer>

      <div className="mobile-contact-bar">
        <a href={`tel:${PHONE.replaceAll("-", "")}`}><Phone /> โทรหานุช</a>
        <a href={LINE_URL} target="_blank" rel="noreferrer"><MessageCircle /> LINE</a>
      </div>

      <AnimatePresence>
        {selectedProperty && (
          <PropertyModal
            property={selectedProperty}
            onClose={closeProperty}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
