import type { Product, ProductReview } from "./types";
import type { MaterialId } from "./materials";

// Helper to generate slightly varied review timestamps (relative to now)
const daysAgo = (n: number): number => Date.now() - n * 24 * 60 * 60 * 1000;

// Sample reviewer pool
const REVIEWER_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&q=80",
];

interface ProductSeed {
  id: string;
  name: string;
  sellerName: string;
  sellerId: string;
  category: Product["category"];
  price: number;
  originalPrice?: number;
  description: string;
  images: { url: string; alt: string }[];
  colors: { name: string; hex: string }[];
  sizes: { label: string; inStock: boolean }[];
  tags: string[];
  featured?: boolean;
  availability: Product["availability"];
  stockCount: number;
  rating: number;
  material?: MaterialId;
  shipsFrom: string;
  shipsWithin: string;
  returns: string;
  reviews: Omit<ProductReview, "id" | "avatar">[];
}

const SEEDS: ProductSeed[] = [
  {
    id: "p1",
    name: "Structured Wool Blazer",
    sellerName: "ATELIER NOIR",
    sellerId: "d1",
    category: "outerwear",
    price: 1280,
    originalPrice: 1480,
    description:
      "Single-breasted blazer in Italian virgin wool. Architectural shoulders, hand-finished lapels, and a sculpted silhouette that holds its shape. Fully canvassed construction, horn buttons, and a silk-lined interior.",
    images: [
      { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop&q=80", alt: "Front view of structured wool blazer" },
      { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=1000&fit=crop&q=80", alt: "Side profile of the blazer" },
      { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&q=80", alt: "Detail of lapels and buttons" },
      { url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&h=1000&fit=crop&q=80", alt: "Back view" },
    ],
    colors: [
      { name: "Charcoal", hex: "#2E2E33" },
      { name: "Camel", hex: "#B0875A" },
      { name: "Black", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: false },
      { label: "XL", inStock: true },
    ],
    tags: ["minimal", "tailoring", "wool"],
    featured: true,
    availability: "in-stock",
    stockCount: 18,
    rating: 4.8,
    material: "velvet",
    shipsFrom: "Paris, France",
    shipsWithin: "3–5 business days",
    returns: "30-day free returns",
    reviews: [
      {
        author: "Eleanor V.",
        rating: 5,
        title: "Investment piece worth every penny",
        body: "The construction is impeccable — fully canvassed, hand-finished lapels, and the wool has a beautiful weight. Fits true to size in the shoulders. I sized down one for a sharper silhouette and it's perfect.",
        createdAt: daysAgo(4),
        verified: true,
        helpful: 24,
        size: "S",
        fit: "true-to-size",
      },
      {
        author: "Marcus L.",
        rating: 5,
        title: "Best blazer I've owned",
        body: "Compared this to a similar Tom Ford piece and the Atelier Noir actually drapes better. The horn buttons are a gorgeous detail. Wears beautifully over a silk tee or a knit.",
        createdAt: daysAgo(12),
        verified: true,
        helpful: 18,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Priya K.",
        rating: 4,
        title: "Beautiful but runs warm",
        body: "The wool is heavier than expected — gorgeous for fall/winter but I wouldn't wear it past April. Quality is undeniable. Shipping from Paris took 6 days.",
        createdAt: daysAgo(28),
        verified: true,
        helpful: 9,
        size: "XS",
        fit: "runs-small",
      },
    ],
  },
  {
    id: "p2",
    name: "Wrap Trench Coat",
    sellerName: "ATELIER NOIR",
    sellerId: "d1",
    category: "outerwear",
    price: 2150,
    description:
      "Belted wrap trench in stone cotton gabardine. Storm flap, raglan sleeves, and a sweeping hem that moves with you. Water-resistant finish, throat latch, and a removable hood.",
    images: [
      { url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop&q=80", alt: "Wrap trench coat front" },
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop&q=80", alt: "Trench coat worn with belt tied" },
      { url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=1000&fit=crop&q=80", alt: "Back of the coat" },
    ],
    colors: [
      { name: "Stone", hex: "#C8B98D" },
      { name: "Black", hex: "#0E0E12" },
      { name: "Olive", hex: "#5A6042" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: false },
    ],
    tags: ["classic", "outerwear", "neutral"],
    availability: "in-stock",
    stockCount: 8,
    rating: 4.7,
    material: "cotton",
    shipsFrom: "Paris, France",
    shipsWithin: "3–5 business days",
    returns: "30-day free returns",
    reviews: [
      {
        author: "Sofia M.",
        rating: 5,
        title: "The perfect spring trench",
        body: "This is the trench I've been searching for. The gabardine has a beautiful hand and the belt gives shape without being restrictive. The stone color goes with everything.",
        createdAt: daysAgo(8),
        verified: true,
        helpful: 15,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Daniel R.",
        rating: 4,
        title: "Stunning but a long coat",
        body: "I'm 5'9\" and this hits mid-calf on me — perfect for what I wanted, but if you're shorter consider the petite. Quality is exceptional.",
        createdAt: daysAgo(20),
        verified: true,
        helpful: 7,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p3",
    name: "Tailored Wool Trousers",
    sellerName: "ATELIER NOIR",
    sellerId: "d1",
    category: "bottoms",
    price: 620,
    description:
      "High-rise wide-leg trousers in charcoal wool. Pressed crease, side pockets, floor-skimming length. Cut for a fluid, elongated silhouette.",
    images: [
      { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1000&fit=crop&q=80", alt: "Tailored wool trousers" },
      { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80", alt: "Trousers styling" },
    ],
    colors: [
      { name: "Charcoal", hex: "#2E2E33" },
      { name: "Cream", hex: "#E8E4D8" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: false },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["tailoring", "wide-leg", "wool"],
    availability: "low-stock",
    stockCount: 4,
    rating: 4.6,
    material: "linen",
    shipsFrom: "Paris, France",
    shipsWithin: "3–5 business days",
    returns: "30-day free returns",
    reviews: [
      {
        author: "Alex T.",
        rating: 5,
        title: "Effortlessly elegant",
        body: "The drape on these is unreal. They pool just slightly at the ankle which I love. Pair them with the matching blazer for a full suit moment.",
        createdAt: daysAgo(15),
        verified: true,
        helpful: 11,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p4",
    name: "Silk Slip Dress",
    sellerName: "MAISON LUMIÈRE",
    sellerId: "d2",
    category: "dresses",
    price: 980,
    description:
      "Bias-cut slip dress in pure Como silk. Cowl neckline, delicate spaghetti straps, and a fluid drape that skims the body. French seams throughout.",
    images: [
      { url: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=1000&fit=crop&q=80", alt: "Silk slip dress front" },
      { url: "https://images.unsplash.com/photo-1623609163859-ca93c959b99c?w=800&h=1000&fit=crop&q=80", alt: "Slip dress side view" },
      { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1000&fit=crop&q=80", alt: "Back detail" },
    ],
    colors: [
      { name: "Champagne", hex: "#D9C7A3" },
      { name: "Black", hex: "#0E0E12" },
      { name: "Burgundy", hex: "#5B1F2E" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: false },
    ],
    tags: ["silk", "evening", "minimal"],
    featured: true,
    availability: "in-stock",
    stockCount: 14,
    rating: 4.9,
    material: "silk",
    shipsFrom: "Milan, Italy",
    shipsWithin: "5–7 business days",
    returns: "14-day returns (hygiene)",
    reviews: [
      {
        author: "Léa B.",
        rating: 5,
        title: "Pure luxury",
        body: "The silk is exceptional — heavy enough to drape beautifully without clinging. The cowl neckline is just right, not too low. I've worn this to two weddings and gotten compliments both times.",
        createdAt: daysAgo(3),
        verified: true,
        helpful: 32,
        size: "S",
        fit: "true-to-size",
      },
      {
        author: "Yuki N.",
        rating: 5,
        title: "Worth the splurge",
        body: "Maison Lumière's silk is the real deal. Bias cut is flattering on any body. The straps are adjustable which is a lifesaver for us petite folks.",
        createdAt: daysAgo(9),
        verified: true,
        helpful: 21,
        size: "XS",
        fit: "runs-small",
      },
      {
        author: "Camille D.",
        rating: 4,
        title: "Beautiful but delicate",
        body: "The silk shows water spots easily — be careful with rain. Otherwise stunning. The champagne color is more ivory in person.",
        createdAt: daysAgo(22),
        verified: true,
        helpful: 14,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Hana W.",
        rating: 5,
        title: "Investment dress",
        body: "I bought this for a gala and it was perfect. Moves beautifully when you walk. Layered with a thin slip underneath for opacity.",
        createdAt: daysAgo(35),
        verified: true,
        helpful: 8,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p5",
    name: "Pleated Maxi Skirt",
    sellerName: "MAISON LUMIÈRE",
    sellerId: "d2",
    category: "bottoms",
    price: 720,
    description:
      "Knife-pleated maxi skirt in flowing silk crepe. Elastic waist, floor-length, with a subtle swish as you walk. Effortlessly elegant.",
    images: [
      { url: "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=800&h=1000&fit=crop&q=80", alt: "Pleated maxi skirt" },
      { url: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&h=1000&fit=crop&q=80", alt: "Skirt in motion" },
    ],
    colors: [
      { name: "Bone", hex: "#E8E4D8" },
      { name: "Olive", hex: "#5A6042" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: false },
    ],
    tags: ["silk", "pleated", "elegant"],
    availability: "in-stock",
    stockCount: 11,
    rating: 4.7,
    material: "chiffon",
    shipsFrom: "Milan, Italy",
    shipsWithin: "5–7 business days",
    returns: "14-day returns (hygiene)",
    reviews: [
      {
        author: "Isabella R.",
        rating: 5,
        title: "Romantic and easy",
        body: "Elastic waist makes this feel like pajamas but looks red-carpet ready. The pleats hold their shape beautifully.",
        createdAt: daysAgo(11),
        verified: true,
        helpful: 12,
        size: "M",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p6",
    name: "Lace Blouse",
    sellerName: "MAISON LUMIÈRE",
    sellerId: "d2",
    category: "tops",
    price: 540,
    description:
      "Romantic lace blouse with a pussy-bow tie. Sheer floral lace over a silk camisole lining, mother-of-pearl buttons, French seams. A timeless, feminine silhouette.",
    images: [
      { url: "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=800&h=1000&fit=crop&q=80", alt: "Lace blouse front" },
      { url: "https://images.unsplash.com/photo-1564257577154-75bd1e2db3bc?w=800&h=1000&fit=crop&q=80", alt: "Lace detail" },
    ],
    colors: [
      { name: "Ivory", hex: "#F4E9DC" },
      { name: "Black", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
    ],
    tags: ["lace", "blouse", "romantic"],
    availability: "in-stock",
    stockCount: 9,
    rating: 4.6,
    material: "lace",
    shipsFrom: "Milan, Italy",
    shipsWithin: "5–7 business days",
    returns: "14-day returns (hygiene)",
    reviews: [
      {
        author: "Aria F.",
        rating: 5,
        title: "Dreamy and detailed",
        body: "The lace is exquisite — not the cheap scratchy kind, this is soft and drapes beautifully. The lining is properly opaque so I don't need a cami.",
        createdAt: daysAgo(6),
        verified: true,
        helpful: 5,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p7",
    name: "Technical Parka",
    sellerName: "KAZE STUDIO",
    sellerId: "d3",
    category: "outerwear",
    price: 890,
    description:
      "Asymmetric technical parka in matte water-repellent nylon. Concealed zips, oversized hood, and a sculpted silhouette inspired by Tokyo rain. Three-pocket front, adjustable hem.",
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop&q=80", alt: "Technical parka front" },
      { url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=1000&fit=crop&q=80", alt: "Hood detail" },
      { url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop&q=80", alt: "Back of parka" },
    ],
    colors: [
      { name: "Matte Black", hex: "#0E0E12" },
      { name: "Concrete", hex: "#7A7A7F" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["technical", "streetwear", "nylon"],
    featured: true,
    availability: "in-stock",
    stockCount: 22,
    rating: 4.8,
    material: "denim",
    shipsFrom: "Tokyo, Japan",
    shipsWithin: "7–10 business days",
    returns: "21-day returns",
    reviews: [
      {
        author: "Kenji M.",
        rating: 5,
        title: "Tokyo-approved",
        body: "Wore this through a typhoon last week and stayed completely dry. The matte finish is gorgeous — looks almost like wool from a distance. Asymmetric cut is pure Kaze.",
        createdAt: daysAgo(2),
        verified: true,
        helpful: 19,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Nadia P.",
        rating: 4,
        title: "Great but stiff at first",
        body: "The nylon takes about a week of wear to soften up. After that it's perfect. The hood is enormous which I love for bad weather.",
        createdAt: daysAgo(18),
        verified: true,
        helpful: 6,
        size: "S",
        fit: "runs-small",
      },
    ],
  },
  {
    id: "p8",
    name: "Layered Knit Sweater",
    sellerName: "KAZE STUDIO",
    sellerId: "d3",
    category: "knitwear",
    price: 460,
    description:
      "Oversized crewneck in merino wool. Drop shoulders, ribbed cuffs, and an architectural drape. Designed to layer — looks intentional over a silk tee or under a coat.",
    images: [
      { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop&q=80", alt: "Layered knit sweater" },
      { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop&q=80", alt: "Knit texture detail" },
    ],
    colors: [
      { name: "Ecru", hex: "#E8E4D8" },
      { name: "Slate", hex: "#3A3F4A" },
    ],
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["knit", "oversized", "wool"],
    availability: "in-stock",
    stockCount: 16,
    rating: 4.5,
    material: "cotton",
    shipsFrom: "Tokyo, Japan",
    shipsWithin: "7–10 business days",
    returns: "21-day returns",
    reviews: [
      {
        author: "Mika S.",
        rating: 5,
        title: "Perfect oversized fit",
        body: "I'm 5'6\" and the S hits at the hip with sleeves past my wrists — exactly the slouchy look I wanted. Merino is soft, not itchy.",
        createdAt: daysAgo(7),
        verified: true,
        helpful: 8,
        size: "S",
        fit: "runs-large",
      },
    ],
  },
  {
    id: "p9",
    name: "Wide-Leg Cargo Pants",
    sellerName: "KAZE STUDIO",
    sellerId: "d3",
    category: "bottoms",
    price: 380,
    description:
      "Cotton-twill cargo pants with asymmetric pockets. Drawstring waist, tapered ankle, monochrome hardware. Built for movement and Tokyo street style.",
    images: [
      { url: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=1000&fit=crop&q=80", alt: "Wide-leg cargo pants" },
      { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1000&fit=crop&q=80", alt: "Pocket detail" },
    ],
    colors: [
      { name: "Black", hex: "#0E0E12" },
      { name: "Sand", hex: "#C8B98D" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
    ],
    tags: ["streetwear", "cargo", "cotton"],
    availability: "low-stock",
    stockCount: 3,
    rating: 4.4,
    material: "denim",
    shipsFrom: "Tokyo, Japan",
    shipsWithin: "7–10 business days",
    returns: "21-day returns",
    reviews: [
      {
        author: "Ryo T.",
        rating: 4,
        title: "Cool cut, runs small",
        body: "Size up — Kaze's bottoms fit slimmer than the tops. Beautiful pocket detail and the drawstring waist is comfortable.",
        createdAt: daysAgo(14),
        verified: true,
        helpful: 4,
        size: "M",
        fit: "runs-small",
      },
    ],
  },
  {
    id: "p10",
    name: "Cashmere Crewneck",
    sellerName: "SOLENNE",
    sellerId: "d4",
    category: "knitwear",
    price: 520,
    originalPrice: 620,
    description:
      "Pure Mongolian cashmere crewneck. Relaxed fit, ribbed trims, and a buttery hand-feel you'll live in. GOTS-certified, ethically sourced.",
    images: [
      { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop&q=80", alt: "Cashmere crewneck" },
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop&q=80", alt: "Cashmere texture" },
      { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop&q=80", alt: "Worn layer" },
    ],
    colors: [
      { name: "Oatmeal", hex: "#E8E4D8" },
      { name: "Storm Grey", hex: "#7A7A7F" },
      { name: "Camel", hex: "#B0875A" },
      { name: "Black", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["cashmere", "knit", "soft"],
    featured: true,
    availability: "in-stock",
    stockCount: 28,
    rating: 4.9,
    material: "cotton",
    shipsFrom: "Los Angeles, USA",
    shipsWithin: "2–4 business days",
    returns: "Free 30-day returns",
    reviews: [
      {
        author: "Maya R.",
        rating: 5,
        title: "Wearing it on a loop",
        body: "I bought this a month ago and have worn it probably 20 times. The cashmere is the softest I've owned at this price point. Worth every cent, especially on sale.",
        createdAt: daysAgo(5),
        verified: true,
        helpful: 27,
        size: "S",
        fit: "true-to-size",
      },
      {
        author: "Olivia H.",
        rating: 5,
        title: "Perfect basic",
        body: "I have it in oatmeal and storm grey. The cut is relaxed but not boxy. Pairs with everything — jeans, slip skirts, under a blazer. Sustainable too.",
        createdAt: daysAgo(13),
        verified: true,
        helpful: 16,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Theo K.",
        rating: 4,
        title: "Pills slightly under arms",
        body: "After about 6 weeks of regular wear I'm seeing minor pilling under the arms — expected for cashmere. A quick depill and it's back to new. Still gorgeous.",
        createdAt: daysAgo(40),
        verified: true,
        helpful: 11,
        size: "L",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p11",
    name: "Ankara Wrap Dress",
    sellerName: "SOLENNE",
    sellerId: "d4",
    category: "dresses",
    price: 680,
    description:
      "Vibrant Ankara wax-print wrap dress with a cowl neckline and asymmetric drape. Bold geometric patterns in saturated jewel tones. A statement piece that celebrates heritage textiles.",
    images: [
      { url: "https://images.unsplash.com/photo-1623609163859-ca93c959b99c?w=800&h=1000&fit=crop&q=80", alt: "Ankara wrap dress" },
      { url: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=1000&fit=crop&q=80", alt: "Print detail" },
    ],
    colors: [
      { name: "Sunset", hex: "#C8472D" },
      { name: "Indigo", hex: "#1F3A68" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["ankara", "dress", "vibrant"],
    availability: "in-stock",
    stockCount: 13,
    rating: 4.7,
    material: "ankara",
    shipsFrom: "Los Angeles, USA",
    shipsWithin: "2–4 business days",
    returns: "Free 30-day returns",
    reviews: [
      {
        author: "Amara O.",
        rating: 5,
        title: "Showstopper",
        body: "Wore this to a gallery opening and got stopped three times. The Ankara print is even more vibrant in person. Wrap style flatters every body.",
        createdAt: daysAgo(10),
        verified: true,
        helpful: 14,
        size: "M",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p12",
    name: "Wide-Leg Linen Trousers",
    sellerName: "SOLENNE",
    sellerId: "d4",
    category: "bottoms",
    price: 420,
    description:
      "European linen trousers with a paper-bag waist. Pleated front, tie belt, and a breezy wide leg. The perfect summer staple that breathes.",
    images: [
      { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80", alt: "Wide-leg linen trousers" },
      { url: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=1000&fit=crop&q=80", alt: "Waist detail" },
    ],
    colors: [
      { name: "Natural", hex: "#C8B98D" },
      { name: "White", hex: "#F5F2EA" },
      { name: "Black", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: false },
      { label: "L", inStock: true },
    ],
    tags: ["linen", "casual", "wide-leg"],
    availability: "in-stock",
    stockCount: 17,
    rating: 4.5,
    material: "linen",
    shipsFrom: "Los Angeles, USA",
    shipsWithin: "2–4 business days",
    returns: "Free 30-day returns",
    reviews: [
      {
        author: "Eva L.",
        rating: 4,
        title: "Perfect summer pants",
        body: "Linen wrinkles (it's linen!) but that's part of the charm. The paper-bag waist is flattering and the legs are perfectly wide without being a tent.",
        createdAt: daysAgo(16),
        verified: true,
        helpful: 9,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p13",
    name: "Velvet Smoking Jacket",
    sellerName: "ATELIER NOIR",
    sellerId: "d1",
    category: "outerwear",
    price: 1850,
    description:
      "Deep plum velvet smoking jacket with satin shawl lapels. Self-tie belt, dropped shoulder, and an enveloping opulence. Inspired by 1970s Yves Saint Laurent.",
    images: [
      { url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=1000&fit=crop&q=80", alt: "Velvet smoking jacket" },
      { url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop&q=80", alt: "Lapel detail" },
    ],
    colors: [
      { name: "Plum", hex: "#5B2A4A" },
      { name: "Bottle Green", hex: "#1F3A2E" },
    ],
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: false },
    ],
    tags: ["velvet", "evening", "opulent"],
    availability: "preorder",
    stockCount: 0,
    rating: 4.8,
    material: "velvet",
    shipsFrom: "Paris, France",
    shipsWithin: "Ships in 3–4 weeks",
    returns: "Final sale",
    reviews: [
      {
        author: "Sebastian C.",
        rating: 5,
        title: "Cocktail hour icon",
        body: "Wore this over a silk tee and trousers for a holiday party — felt like a 70s movie star. The velvet catches light gorgeously. Worth the wait on preorder.",
        createdAt: daysAgo(25),
        verified: true,
        helpful: 13,
        size: "M",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p14",
    name: "Chiffon Layered Gown",
    sellerName: "MAISON LUMIÈRE",
    sellerId: "d2",
    category: "dresses",
    price: 820,
    description:
      "Floating chiffon gown with multiple sheer layers. Body-skimming underlay, midi length, with a graceful boat neckline. Ethereal and weightless.",
    images: [
      { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1000&fit=crop&q=80", alt: "Chiffon layered gown" },
      { url: "https://images.unsplash.com/photo-1623609163859-ca93c959b99c?w=800&h=1000&fit=crop&q=80", alt: "Layered detail" },
    ],
    colors: [
      { name: "Pale Blush", hex: "#E5D4E0" },
      { name: "Smoke", hex: "#7A7A7F" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: false },
    ],
    tags: ["chiffon", "gown", "ethereal"],
    availability: "in-stock",
    stockCount: 7,
    rating: 4.6,
    material: "chiffon",
    shipsFrom: "Milan, Italy",
    shipsWithin: "5–7 business days",
    returns: "14-day returns (hygiene)",
    reviews: [
      {
        author: "Genevieve P.",
        rating: 5,
        title: "Fairy tale",
        body: "Wore this for engagement photos and they're stunning. The layers move like a dream in the wind. The underlay is properly opaque.",
        createdAt: daysAgo(19),
        verified: true,
        helpful: 7,
        size: "S",
        fit: "true-to-size",
      },
    ],
  },
  {
    id: "p15",
    name: "Asymmetric Silk Top",
    sellerName: "KAZE STUDIO",
    sellerId: "d3",
    category: "tops",
    price: 320,
    description:
      "Silk charmeuse top with an asymmetric drape. One-shoulder detail, lustrous finish, and a sculpted sleeve. Modern and architectural.",
    images: [
      { url: "https://images.unsplash.com/photo-1564257577154-75bd1e2db3bc?w=800&h=1000&fit=crop&q=80", alt: "Asymmetric silk top" },
      { url: "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=800&h=1000&fit=crop&q=80", alt: "Side detail" },
    ],
    colors: [
      { name: "Pearl", hex: "#E8E4D8" },
      { name: "Onyx", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
    ],
    tags: ["asymmetric", "silk", "modern"],
    availability: "low-stock",
    stockCount: 5,
    rating: 4.4,
    material: "silk",
    shipsFrom: "Tokyo, Japan",
    shipsWithin: "7–10 business days",
    returns: "21-day returns",
    reviews: [
      {
        author: "Lin H.",
        rating: 4,
        title: "Statement piece",
        body: "The one-shoulder cut is striking. Sizing down — Kaze runs generous in tops. The silk has a beautiful luster.",
        createdAt: daysAgo(21),
        verified: true,
        helpful: 3,
        size: "XS",
        fit: "runs-large",
      },
    ],
  },
  {
    id: "p16",
    name: "Denim Trucker Jacket",
    sellerName: "SOLENNE",
    sellerId: "d4",
    category: "outerwear",
    price: 580,
    description:
      "Classic indigo denim trucker jacket with copper rivets and contrast topstitching. Box-shoulder, button-front, broken-in feel from day one. A forever wardrobe staple.",
    images: [
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop&q=80", alt: "Denim trucker jacket" },
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop&q=80", alt: "Worn detail" },
    ],
    colors: [
      { name: "Indigo", hex: "#3B5894" },
      { name: "Stonewash", hex: "#8FA4C2" },
      { name: "Black", hex: "#0E0E12" },
    ],
    sizes: [
      { label: "XS", inStock: true },
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
    ],
    tags: ["denim", "jacket", "classic"],
    availability: "in-stock",
    stockCount: 31,
    rating: 4.7,
    material: "denim",
    shipsFrom: "Los Angeles, USA",
    shipsWithin: "2–4 business days",
    returns: "Free 30-day returns",
    reviews: [
      {
        author: "Mia J.",
        rating: 5,
        title: "Forever jacket",
        body: "The denim is the perfect weight — not too stiff, not too soft. Already breaking in beautifully. The indigo will fade perfectly over the years.",
        createdAt: daysAgo(9),
        verified: true,
        helpful: 11,
        size: "M",
        fit: "true-to-size",
      },
      {
        author: "Carlos D.",
        rating: 4,
        title: "Great jacket, runs snug",
        body: "Size up if you want to layer over sweaters. I'm a true medium in most things and the L was perfect for layering.",
        createdAt: daysAgo(33),
        verified: true,
        helpful: 5,
        size: "L",
        fit: "runs-small",
      },
    ],
  },
];

function buildProduct(seed: ProductSeed, index: number): Product {
  const reviews: ProductReview[] = seed.reviews.map((r, i) => ({
    ...r,
    id: `${seed.id}-r${i + 1}`,
    avatar: REVIEWER_AVATARS[index % REVIEWER_AVATARS.length],
  }));
  return {
    ...seed,
    image: seed.images[0].url,
    reviewCount: reviews.length,
    reviews,
  };
}

export const PRODUCTS: Product[] = SEEDS.map(buildProduct);

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsBySeller(sellerId: string): Product[] {
  return PRODUCTS.filter((p) => p.sellerId === sellerId);
}

export function getRelatedProducts(productId: string, limit = 4): Product[] {
  const product = getProductById(productId);
  if (!product) return PRODUCTS.slice(0, limit);
  return PRODUCTS.filter(
    (p) =>
      p.id !== productId &&
      (p.category === product.category || p.sellerId === product.sellerId)
  ).slice(0, limit);
}
