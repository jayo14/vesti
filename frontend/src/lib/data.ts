import type { Garment, Designer } from "./types";
import type { MaterialId } from "./materials";

// We use Unsplash source URLs for high-quality fashion imagery.
// These are stable, royalty-free fashion product photos.

export const DESIGNERS: Designer[] = [
  {
    id: "d1",
    name: "ATELIER NOIR",
    tagline: "Quiet luxury, loud presence",
    bio: "A Paris-born atelier redefining minimalism through architectural silhouettes and rare materials. Each piece is hand-finished by master tailors in our 8th arrondissement workshop.",
    avatar:
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=200&h=200&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&h=600&fit=crop&q=80",
    location: "Paris, France",
    specialties: ["Tailoring", "Outerwear", "Knitwear"],
    collectionCount: 24,
    rating: 4.9,
    verified: true,
  },
  {
    id: "d2",
    name: "MAISON LUMIÈRE",
    tagline: "Light, draped in silk",
    bio: "Italian craftsmanship meets modern femininity. Our silk mill in Como has produced fabrics for couture houses since 1923 — now we craft our own collections from those same threads.",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=600&fit=crop&q=80",
    location: "Milan, Italy",
    specialties: ["Silk", "Dresses", "Eveningwear"],
    collectionCount: 18,
    rating: 4.8,
    verified: true,
  },
  {
    id: "d3",
    name: "KAZE STUDIO",
    tagline: "Tokyo street, refined",
    bio: "From Shibuya to your wardrobe. KAZE fuses Japanese textile innovation with streetwear sensibility — technical fabrics, asymmetric cuts, and a monochrome palette.",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=600&fit=crop&q=80",
    location: "Tokyo, Japan",
    specialties: ["Streetwear", "Technical", "Layering"],
    collectionCount: 32,
    rating: 4.7,
    verified: true,
  },
  {
    id: "d4",
    name: "SOLENNE",
    tagline: "California ease, elevated",
    bio: "Los Angeles-based Solenne makes the kind of pieces you live in — cashmere knits, draped trousers, and effortless dresses. Sustainability woven into every seam.",
    avatar:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=1200&h=600&fit=crop&q=80",
    location: "Los Angeles, USA",
    specialties: ["Knitwear", "Sustainable", "Casual"],
    collectionCount: 21,
    rating: 4.85,
    verified: true,
  },
];

const G = (
  id: string,
  name: string,
  designer: string,
  designerId: string,
  category: Garment["category"],
  price: number,
  image: string,
  description: string,
  tags: string[] = [],
  featured = false,
  material?: MaterialId
): Garment => ({
  id,
  name,
  designer,
  designerId,
  category,
  price,
  currency: "USD",
  image,
  description,
  colors: ["Black", "Cream", "Stone"],
  sizes: ["XS", "S", "M", "L", "XL"],
  tags,
  featured,
  inStock: true,
  material,
});

export const GARMENTS: Garment[] = [
  // ATELIER NOIR
  G(
    "g1",
    "Structured Wool Blazer",
    "ATELIER NOIR",
    "d1",
    "outerwear",
    1280,
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop&q=80",
    "Single-breasted blazer in Italian virgin wool. Architectural shoulders, hand-finished lapels, and a sculpted silhouette that holds its shape.",
    ["minimal", "tailoring", "wool"],
    true,
    "velvet"
  ),
  G(
    "g2",
    "Wrap Trench Coat",
    "ATELIER NOIR",
    "d1",
    "outerwear",
    2150,
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop&q=80",
    "Belted wrap trench in stone cotton gabardine. Storm flap, raglan sleeves, and a sweeping hem that moves with you.",
    ["classic", "outerwear", "neutral"],
    false,
    "cotton"
  ),
  G(
    "g3",
    "Tailored Wool Trousers",
    "ATELIER NOIR",
    "d1",
    "bottoms",
    620,
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&q=80",
    "High-rise wide-leg trousers in charcoal wool. Pressed crease, side pockets, floor-skimming length.",
    ["tailoring", "wide-leg", "wool"],
    false,
    "linen"
  ),

  // MAISON LUMIÈRE
  G(
    "g4",
    "Silk Slip Dress",
    "MAISON LUMIÈRE",
    "d2",
    "dresses",
    980,
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop&q=80",
    "Bias-cut slip dress in pure Como silk. Cowl neckline, delicate spaghetti straps, and a fluid drape that skims the body.",
    ["silk", "evening", "minimal"],
    true,
    "silk"
  ),
  G(
    "g5",
    "Pleated Maxi Skirt",
    "MAISON LUMIÈRE",
    "d2",
    "bottoms",
    720,
    "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=600&h=800&fit=crop&q=80",
    "Knife-pleated maxi skirt in flowing silk crepe. Elastic waist, floor-length, with a subtle swish as you walk.",
    ["silk", "pleated", "elegant"],
    false,
    "chiffon"
  ),
  G(
    "g6",
    "Lace Blouse",
    "MAISON LUMIÈRE",
    "d2",
    "tops",
    540,
    "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=600&h=800&fit=crop&q=80",
    "Romantic lace blouse with a pussy-bow tie. Sheer floral lace over a silk camisole lining, mother-of-pearl buttons, French seams.",
    ["lace", "blouse", "romantic"],
    false,
    "lace"
  ),

  // KAZE STUDIO
  G(
    "g7",
    "Technical Parka",
    "KAZE STUDIO",
    "d3",
    "outerwear",
    890,
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop&q=80",
    "Asymmetric technical parka in matte nylon. Concealed zips, oversized hood, and a sculpted silhouette inspired by Tokyo rain.",
    ["technical", "streetwear", "nylon"],
    true,
    "denim"
  ),
  G(
    "g8",
    "Layered Knit Sweater",
    "KAZE STUDIO",
    "d3",
    "knitwear",
    460,
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop&q=80",
    "Oversized crewneck in merino wool. Drop shoulders, ribbed cuffs, and an architectural drape.",
    ["knit", "oversized", "wool"],
    false,
    "cotton"
  ),
  G(
    "g9",
    "Wide-Leg Cargo Pants",
    "KAZE STUDIO",
    "d3",
    "bottoms",
    380,
    "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600&h=800&fit=crop&q=80",
    "Cotton-twill cargo pants with asymmetric pockets. Drawstring waist, tapered ankle, monochrome hardware.",
    ["streetwear", "cargo", "cotton"],
    false,
    "denim"
  ),

  // SOLENNE
  G(
    "g10",
    "Cashmere Crewneck",
    "SOLENNE",
    "d4",
    "knitwear",
    520,
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop&q=80",
    "Pure Mongolian cashmere crewneck. Relaxed fit, ribbed trims, and a buttery hand-feel you'll live in.",
    ["cashmere", "knit", "soft"],
    true,
    "cotton"
  ),
  G(
    "g11",
    "Ankara Wrap Dress",
    "SOLENNE",
    "d4",
    "dresses",
    680,
    "https://images.unsplash.com/photo-1623609163859-ca93c959b99c?w=600&h=800&fit=crop&q=80",
    "Vibrant Ankara wax-print wrap dress with a cowl neckline and asymmetric drape. Effortless from morning to evening.",
    ["ankara", "dress", "vibrant"],
    false,
    "ankara"
  ),
  G(
    "g12",
    "Wide-Leg Linen Trousers",
    "SOLENNE",
    "d4",
    "bottoms",
    420,
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop&q=80",
    "European linen trousers with a paper-bag waist. Pleated front, tie belt, and a breezy wide leg.",
    ["linen", "casual", "wide-leg"],
    false,
    "linen"
  ),

  // More pieces
  G(
    "g13",
    "Velvet Smoking Jacket",
    "ATELIER NOIR",
    "d1",
    "outerwear",
    1850,
    "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&h=800&fit=crop&q=80",
    "Deep plum velvet smoking jacket with satin shawl lapels. Self-tie belt, dropped shoulder, and an enveloping opulence.",
    ["velvet", "evening", "opulent"],
    false,
    "velvet"
  ),
  G(
    "g14",
    "Chiffon Layered Gown",
    "MAISON LUMIÈRE",
    "d2",
    "dresses",
    820,
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop&q=80",
    "Floating chiffon gown with multiple sheer layers. Body-skimming underlay, midi length, with a graceful boat neckline.",
    ["chiffon", "gown", "ethereal"],
    false,
    "chiffon"
  ),
  G(
    "g15",
    "Asymmetric Top",
    "KAZE STUDIO",
    "d3",
    "tops",
    320,
    "https://images.unsplash.com/photo-1564257577154-75bd1e2db3bc?w=600&h=800&fit=crop&q=80",
    "Silk charmeuse top with an asymmetric drape. One-shoulder detail, lustrous finish, and a sculpted sleeve.",
    ["asymmetric", "silk", "modern"],
    false,
    "silk"
  ),
  G(
    "g16",
    "Denim Trucker Jacket",
    "SOLENNE",
    "d4",
    "knitwear",
    580,
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop&q=80",
    "Classic indigo denim trucker jacket with copper rivets and contrast topstitching. Box-shoulder, button-front, broken-in feel.",
    ["denim", "jacket", "classic"],
    false,
    "denim"
  ),
];

export const FEATURED_GARMENTS = GARMENTS.filter((g) => g.featured);

export function getDesignerById(id: string): Designer | undefined {
  return DESIGNERS.find((d) => d.id === id);
}

export function getGarmentsByDesigner(designerId: string): Garment[] {
  return GARMENTS.filter((g) => g.designerId === designerId);
}
