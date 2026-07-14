/**
 * AI Material-Aware Design library.
 *
 * Each fabric entry teaches the image generator how that material actually
 * behaves in the real world — drape, weight, structure, sheen, typical
 * constructions, and what is physically impossible. This keeps the AI from
 * forcing constructions the fabric cannot support (e.g., a structured
 * box-shoulder blazer in chiffon, or a flowing bias-cut slip in stiff denim).
 */

export type MaterialId =
  | "ankara"
  | "lace"
  | "silk"
  | "cotton"
  | "denim"
  | "linen"
  | "velvet"
  | "chiffon";

export interface MaterialSpec {
  id: MaterialId;
  name: string;
  origin: string;
  /** Short sensory description for UI */
  summary: string;
  /** Visual swatch color used in the UI chip */
  swatch: string;
  /** Surface texture shown in the chip (CSS gradient) */
  swatchPattern?: string;
  drape: "fluid" | "soft" | "structured" | "rigid";
  weight: "light" | "medium" | "heavy";
  sheen: "matte" | "subtle" | "lustrous" | "high-shine";
  structure: "none" | "low" | "medium" | "high";
  /** What kind of garments this fabric is naturally suited to */
  suitableFor: string[];
  /** Constructions that are physically impossible or wrong for this fabric */
  avoid: string[];
  /** Prompt directives injected into the image generation call */
  promptDirectives: string;
}

export const MATERIALS: MaterialSpec[] = [
  {
    id: "ankara",
    name: "Ankara",
    origin: "West Africa",
    summary:
      "Vibrant wax-printed cotton with bold geometric patterns. Crisp hand, holds shape, celebrates color.",
    swatch: "#C8472D",
    swatchPattern:
      "repeating-linear-gradient(45deg, #C8472D 0 8px, #E8B53A 8px 12px, #1F3A68 12px 20px, #C8472D 20px 28px)",
    drape: "structured",
    weight: "medium",
    sheen: "matte",
    structure: "medium",
    suitableFor: [
      "A-line dresses",
      "Wrap tops",
      "Tiered skirts",
      "Tailored jumpsuits",
      "Structured headwraps",
    ],
    avoid: [
      "Bias-cut slip dresses (fabric too crisp)",
      "Floating chiffon-like layers",
      "Skin-tight jersey silhouettes",
    ],
    promptDirectives:
      "Ankara wax-print cotton: bold geometric tribal patterns in saturated jewel tones, crisp matte hand, holds its shape with a gentle A-line swing. The fabric has visible wax-resist print edges and a slightly stiff drape that creates structured volume rather than fluid folds. Surface shows traditional motifs (suns, kente-inspired geometry, Adinkra symbols). Do NOT render as soft silk, sheer chiffon, or shiny polyester — Ankara is matte, opaque, and architectural.",
  },
  {
    id: "lace",
    name: "Lace",
    origin: "France / Belgium",
    summary:
      "Delicate openwork fabric with floral or geometric motifs. Semi-sheer, romantic, intricate.",
    swatch: "#F4E9DC",
    swatchPattern:
      "radial-gradient(circle at 20% 30%, #FFFFFF 0 4px, transparent 4px 8px), radial-gradient(circle at 70% 60%, #FFFFFF 0 3px, transparent 3px 7px), radial-gradient(circle at 40% 80%, #FFFFFF 0 5px, transparent 5px 9px), #F4E9DC",
    drape: "soft",
    weight: "light",
    sheen: "subtle",
    structure: "low",
    suitableFor: [
      "Romantic dresses",
      "Bridal gowns",
      "Blouses with lining",
      "Overlay on slip dresses",
      "Sleeves and yokes",
    ],
    avoid: [
      "Stiff tailored blazers (no body)",
      "Heavy structured outerwear",
      "Skin-tight opaque leggings",
    ],
    promptDirectives:
      "Lace: delicate openwork fabric with intricate floral or guipure motifs, semi-sheer with a soft ivory or nude underlay visible through the holes. Subtle matte sheen, featherweight, drapes softly around the body. The pattern reveals skin or lining through negative space — never render lace as a solid opaque cloth. Edge details show scalloped picot finishes. Suitable for romantic, ethereal, or bridal silhouettes with gentle gathers, not rigid tailoring.",
  },
  {
    id: "silk",
    name: "Silk",
    origin: "China",
    summary:
      "Lustrous protein-fiber fabric. Fluid drape, liquid sheen, sensuous against the body.",
    swatch: "#D9C7A3",
    swatchPattern:
      "linear-gradient(135deg, #E8D7B0 0%, #D9C7A3 40%, #C9B690 60%, #E8D7B0 100%)",
    drape: "fluid",
    weight: "light",
    sheen: "lustrous",
    structure: "none",
    suitableFor: [
      "Bias-cut slip dresses",
      "Fluid blouses",
      "Evening gowns",
      "Scarves and ties",
      "Lingerie",
    ],
    avoid: [
      "Box-shoulder blazers (no structure)",
      "Stiff pleated kilts",
      "Heavy winter coats",
    ],
    promptDirectives:
      "Pure silk: liquid lustrous sheen that catches light in long bright highlights along folds, fluid bias-cut drape that skims and follows the body's curves, featherweight hand. The surface shows subtle irregular slubs and a glossy patina that shifts with movement. Folds are soft, elongated, and gravity-driven — never crisp or architectural. Suitable for slinky slips, draped gowns, and fluid blouses. Do NOT render as stiff cotton or matte crepe — silk has a recognizable warm pearl-like luminosity.",
  },
  {
    id: "cotton",
    name: "Cotton",
    origin: "Worldwide",
    summary:
      "Versatile natural fiber. Breathable, matte, easy to tailor. The everyday workhorse.",
    swatch: "#E8E4D8",
    swatchPattern:
      "repeating-linear-gradient(0deg, #E8E4D8 0 2px, #DCD6C5 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, #F2EFE5 2px 3px)",
    drape: "soft",
    weight: "medium",
    sheen: "matte",
    structure: "medium",
    suitableFor: [
      "T-shirts and polos",
      "Button-down shirts",
      "Casual dresses",
      "Trousers",
      "Light summer wear",
    ],
    avoid: [
      "Couture gowns with extreme drape",
      "High-shine eveningwear",
      "Architectural sculptural pieces",
    ],
    promptDirectives:
      "Cotton: breathable natural fiber with a matte soft surface, gentle body, and a relaxed everyday drape. The fabric holds light creases and soft folds rather than sharp pleats. Surface shows a subtle plain-weave texture visible at close range. Versatile and unpretentious — perfect for shirts, tees, casual dresses, and trousers. Do NOT render with the high shine of silk, the rigidity of denim, or the sheerness of chiffon.",
  },
  {
    id: "denim",
    name: "Denim",
    origin: "Nîmes, France",
    summary:
      "Sturdy twill-weave cotton. Rigid, durable, develops character with wear. Heritage workwear.",
    swatch: "#3B5894",
    swatchPattern:
      "repeating-linear-gradient(45deg, #3B5894 0 2px, #2E4674 2px 3px, #4A68A4 3px 5px)",
    drape: "rigid",
    weight: "heavy",
    sheen: "matte",
    structure: "high",
    suitableFor: [
      "Jeans and jackets",
      "Trucker jackets",
      "A-line denim skirts",
      "Overalls and jumpsuits",
      "Workwear",
    ],
    avoid: [
      "Fluid bias-cut dresses",
      "Floating sheer layers",
      "Soft draped lingerie",
    ],
    promptDirectives:
      "Denim: heavy cotton twill with a visible diagonal weave, rigid and structured with sharp creases at stress points (knees, elbows). The classic indigo blue shows subtle fading at high-wear areas and a matte stonewashed surface. Holds its shape — does not flow or drape softly. Perfect for jeans, trucker jackets, and structured skirts with topstitched seams and rivets. Do NOT render as flowing silk or soft jersey — denim is architectural, weighty, and unmistakably twill-woven.",
  },
  {
    id: "linen",
    name: "Linen",
    origin: "Europe / Egypt",
    summary:
      "Crisp plant fiber from flax. Breathable, naturally wrinkled, effortlessly elegant in summer.",
    swatch: "#C8B98D",
    swatchPattern:
      "repeating-linear-gradient(0deg, #C8B98D 0 1px, #B5A677 1px 2px, #D5C89B 2px 3px), repeating-linear-gradient(90deg, transparent 0 1px, #B5A677 1px 2px)",
    drape: "soft",
    weight: "light",
    sheen: "matte",
    structure: "low",
    suitableFor: [
      "Summer suits",
      "Relaxed trousers",
      "Button-down shirts",
      "Caftans and tunic dresses",
      "Beachwear",
    ],
    avoid: [
      "Sharp tailored suiting (wrinkles too much)",
      "Sculptural architectural pieces",
      "Crisp military pleats",
    ],
    promptDirectives:
      "Linen: natural flax fiber with a slightly slubby texture, a dry matte hand, and characteristic casual wrinkles and creases throughout. Earthy oatmeal or stone tones, breathable and relaxed. The fabric drapes softly but holds a slightly crisp body — perfect for summer suits, relaxed trousers, and breezy tunics. Wrinkles are part of the look and should be visible. Do NOT render as smooth silk, rigid denim, or polished cotton — linen has an unmistakable rustic slubby character.",
  },
  {
    id: "velvet",
    name: "Velvet",
    origin: "Italy / Persia",
    summary:
      "Plush pile fabric with deep pile that catches light in luxurious gradients. Opulent, wintry.",
    swatch: "#5B2A4A",
    swatchPattern:
      "linear-gradient(135deg, #7B3A60 0%, #5B2A4A 40%, #3D1A35 60%, #7B3A60 100%)",
    drape: "soft",
    weight: "heavy",
    sheen: "lustrous",
    structure: "medium",
    suitableFor: [
      "Evening gowns",
      "Smoking jackets",
      "Cocktail dresses",
      "Winter coats",
      "Statement blazers",
    ],
    avoid: [
      "Light summer dresses (too heavy)",
      "Athletic wear",
      "Floating sheer layers",
    ],
    promptDirectives:
      "Velvet: plush dense pile fabric with a deep directional sheen — light catches the pile creating rich tonal gradients across folds, lighter where the pile is brushed one way and darker the other. Heavy, opulent, wintry. Colors appear deeper and more saturated than flat fabric. Drapes with weighty fluid folds. Perfect for evening gowns, smoking jackets, and statement blazers. Do NOT render as flat matte cotton, sheer chiffon, or fluid silk — velvet has a recognizable directional pile sheen with rich shadow play.",
  },
  {
    id: "chiffon",
    name: "Chiffon",
    origin: "France",
    summary:
      "Sheer gossamer fabric, almost weightless. Floats and layers dreamily. Ethereal and romantic.",
    swatch: "#E5D4E0",
    swatchPattern:
      "radial-gradient(ellipse at 30% 40%, #FFFFFF 0 30%, transparent 30% 70%), radial-gradient(ellipse at 70% 60%, #F5E8F0 0 40%, transparent 40% 80%), #E5D4E0",
    drape: "fluid",
    weight: "light",
    sheen: "subtle",
    structure: "none",
    suitableFor: [
      "Layered evening gowns",
      "Bridesmaid dresses",
      "Flowing sleeves",
      "Overlay skirts",
      "Sari and dupatta",
    ],
    avoid: [
      "Structured blazers (no body)",
      "Tailored trousers",
      "Fitted sheath dresses (alone)",
    ],
    promptDirectives:
      "Chiffon: sheer gossamer fabric, almost weightless, that floats and layers dreamily. Multiple layers create subtle opacity while individual layers remain translucent with a soft matte sheen. Drapes in long airy folds that move with the slightest breeze, with raw or narrow-rolled hems. The fabric reveals the silhouette beneath through layers of misty translucency. Perfect for layered gowns, flowing sleeves, and overlay skirts. Do NOT render as opaque silk, rigid cotton, or structured denim — chiffon is unmistakably sheer, weightless, and ethereal.",
  },
];

export const MATERIAL_MAP: Record<MaterialId, MaterialSpec> = MATERIALS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MaterialId, MaterialSpec>
);

export function getMaterial(id: MaterialId | string | undefined): MaterialSpec | undefined {
  if (!id) return undefined;
  return MATERIAL_MAP[id as MaterialId];
}
