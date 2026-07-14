import type { EditableComponent } from "./types";

/**
 * Editable component definitions for the AI Fashion Playground.
 *
 * Each component declares:
 *  - a UI label + icon name (mapped to lucide-react in the UI)
 *  - a short description for the control panel
 *  - a list of preset actions the user can click (each composes a natural
 *    language prompt the AI understands)
 *  - an optional color/option picker schema (e.g. buttons: gold/silver/black,
 *    colors: a swatch palette)
 */

export interface ComponentPreset {
  /** Short label shown on the chip */
  label: string;
  /** The natural-language prompt sent to the AI */
  prompt: string;
}

export interface ColorOption {
  label: string;
  hex: string;
}

export interface EditableComponentSpec {
  id: EditableComponent;
  label: string;
  /** Lucide icon name (string) — UI maps to the actual icon component */
  icon: string;
  description: string;
  /** Quick-action presets — clicking sends the prompt directly */
  presets: ComponentPreset[];
  /** Optional color palette (for colors / buttons / zippers) */
  colors?: ColorOption[];
  /** Optional free-form picker label (e.g. "Pick a print") */
  optionPicker?: {
    label: string;
    options: { label: string; prompt: string }[];
  };
}

export const EDITABLE_COMPONENTS: EditableComponentSpec[] = [
  {
    id: "sleeves",
    label: "Sleeves",
    icon: "Shirt",
    description: "Length, volume, cuff style, silhouette.",
    presets: [
      { label: "Puffier", prompt: "Make the sleeves puffier with gathered volume at the shoulder." },
      { label: "Longer", prompt: "Lengthen the sleeves to full wrist-length with a clean cuff." },
      { label: "Sleeveless", prompt: "Remove the sleeves entirely to make it sleeveless." },
      { label: "Bell", prompt: "Change the sleeves to bell sleeves that flare at the wrist." },
      { label: "Cap", prompt: "Shorten the sleeves to cap sleeves that just cover the shoulder." },
      { label: "Balloon", prompt: "Change the sleeves to balloon sleeves with elasticized hems." },
    ],
  },
  {
    id: "collar",
    label: "Collar",
    icon: "ChevronUp",
    description: "Collar style, height, shape, lapels.",
    presets: [
      { label: "Mandarin", prompt: "Replace the collar with a mandarin collar — a short stand-up collar with no lapels." },
      { label: "Wing tip", prompt: "Add wing-tip collar with pointed corners folded outward." },
      { label: "Turtle", prompt: "Add a turtleneck collar that folds over at the neck." },
      { label: "Peter Pan", prompt: "Change to a rounded Peter Pan collar with soft curved edges." },
      { label: "Shawl", prompt: "Add a shawl collar with continuous curved lapels." },
      { label: "No collar", prompt: "Remove the collar entirely for a clean jewel neckline." },
    ],
  },
  {
    id: "neckline",
    label: "Neckline",
    icon: "Triangle",
    description: "V-neck, scoop, boat, asymmetric, halter.",
    presets: [
      { label: "Deep V", prompt: "Lower the neckline into a deep V-neck." },
      { label: "Scoop", prompt: "Change the neckline to a scoop neck with a curved U-shape." },
      { label: "Boat", prompt: "Widen the neckline into a boat neckline that runs horizontally across the collarbones." },
      { label: "Halter", prompt: "Change the neckline to a halter neck with straps tied behind the neck." },
      { label: "One-shoulder", prompt: "Make the neckline asymmetric, one-shoulder." },
      { label: "Sweetheart", prompt: "Change the neckline to a sweetheart shape with a curved dip in the center." },
    ],
  },
  {
    id: "buttons",
    label: "Buttons",
    icon: "Circle",
    description: "Number, color, material, size.",
    presets: [
      { label: "Gold", prompt: "Replace the buttons with polished gold buttons." },
      { label: "Silver", prompt: "Replace the buttons with brushed silver buttons." },
      { label: "Pearl", prompt: "Replace the buttons with lustrous pearl buttons." },
      { label: "Horn", prompt: "Replace the buttons with dark horn buttons." },
      { label: "Wooden", prompt: "Replace the buttons with natural wooden buttons." },
      { label: "Remove all", prompt: "Remove all buttons and close the front with hidden snaps." },
    ],
    colors: [
      { label: "Gold", hex: "#C9A24B" },
      { label: "Silver", hex: "#B8B8C0" },
      { label: "Black", hex: "#1A1A1F" },
      { label: "Ivory", hex: "#F2EBD8" },
      { label: "Burgundy", hex: "#5B1F2E" },
      { label: "Navy", hex: "#1F2E54" },
    ],
  },
  {
    id: "zippers",
    label: "Zippers",
    icon: "AlignVerticalJustifyCenter",
    description: "Add, remove, expose, color.",
    presets: [
      { label: "Exposed gold", prompt: "Add an exposed gold metal zipper down the center front." },
      { label: "Invisible", prompt: "Replace visible closures with an invisible zipper on the side seam." },
      { label: "Two-way", prompt: "Add a two-way zipper that opens from top and bottom." },
      { label: "Remove", prompt: "Remove the zipper and replace with button closure." },
      { label: "Decorative", prompt: "Add a decorative oversized zipper as a statement detail." },
    ],
  },
  {
    id: "pockets",
    label: "Pockets",
    icon: "Pocket",
    description: "Patch, welt, flap, hidden.",
    presets: [
      { label: "Patch", prompt: "Add visible patch pockets on the front." },
      { label: "Welt", prompt: "Add sleek welt pockets integrated into the seams." },
      { label: "Flap", prompt: "Add flap pockets with a buttoned flap closure." },
      { label: "Side seam", prompt: "Add hidden side-seam pockets." },
      { label: "Remove", prompt: "Remove all pockets for a clean minimalist look." },
      { label: "Cargo", prompt: "Add large cargo pockets on the sides." },
    ],
  },
  {
    id: "hemline",
    label: "Hemline",
    icon: "Minus",
    description: "Straight, curved, asymmetric, high-low.",
    presets: [
      { label: "Curved", prompt: "Change the hemline to a gently curved shape." },
      { label: "Asymmetric", prompt: "Make the hemline asymmetric — longer on one side." },
      { label: "High-low", prompt: "Change to a high-low hemline — shorter in front, longer in back." },
      { label: "Scalloped", prompt: "Add a scalloped hemline with curved picot edges." },
      { label: "Handkerchief", prompt: "Change to a handkerchief hemline with pointed corners." },
    ],
  },
  {
    id: "length",
    label: "Length",
    icon: "Ruler",
    description: "Mini, knee, midi, maxi, cropped.",
    presets: [
      { label: "Cropped", prompt: "Turn this into a cropped top, ending above the waist." },
      { label: "Mini", prompt: "Shorten to a mini length, ending mid-thigh." },
      { label: "Knee", prompt: "Adjust the length to end just above the knee." },
      { label: "Midi", prompt: "Lengthen to midi length, ending mid-calf." },
      { label: "Maxi", prompt: "Lengthen to maxi length, ending at the ankle." },
      { label: "Floor", prompt: "Lengthen to floor-sweeping length." },
    ],
  },
  {
    id: "embroidery",
    label: "Embroidery",
    icon: "Flower2",
    description: "Floral, geometric, monogram, placement.",
    presets: [
      { label: "Neckline", prompt: "Add delicate floral embroidery around the neckline in gold thread." },
      { label: "Cuffs", prompt: "Add embroidered detailing on the cuffs in tonal thread." },
      { label: "Hem", prompt: "Add a band of geometric embroidery along the hem." },
      { label: "All-over", prompt: "Add subtle scattered floral embroidery across the entire garment." },
      { label: "Monogram", prompt: "Add a small monogram embroidered on the chest." },
      { label: "Remove", prompt: "Remove all embroidery for a clean look." },
    ],
    optionPicker: {
      label: "Embroidery color",
      options: [
        { label: "Gold", prompt: "Use metallic gold embroidery thread." },
        { label: "Silver", prompt: "Use metallic silver embroidery thread." },
        { label: "Tonal", prompt: "Use tonal embroidery thread matching the fabric." },
        { label: "Contrast", prompt: "Use a contrasting embroidery thread color." },
      ],
    },
  },
  {
    id: "prints",
    label: "Prints",
    icon: "Palette",
    description: "Floral, stripes, polka, animal, geometric.",
    presets: [
      { label: "Floral", prompt: "Add an all-over ditsy floral print." },
      { label: "Stripes", prompt: "Add vertical pinstripes." },
      { label: "Polka dots", prompt: "Add a polka-dot print in a contrasting color." },
      { label: "Leopard", prompt: "Add a leopard-spot animal print." },
      { label: "Geometric", prompt: "Add a bold geometric print with chevrons and triangles." },
      { label: "Plaid", prompt: "Add a tartan plaid pattern." },
      { label: "Solid", prompt: "Remove all prints for a solid color." },
    ],
  },
  {
    id: "colors",
    label: "Colors",
    icon: "Droplet",
    description: "Change the garment's color or palette.",
    presets: [
      { label: "Black", prompt: "Change the garment color to solid black." },
      { label: "White", prompt: "Change the garment color to solid white." },
      { label: "Burgundy", prompt: "Change the garment color to deep burgundy." },
      { label: "Sage", prompt: "Change the garment color to soft sage green." },
      { label: "Navy", prompt: "Change the garment color to deep navy blue." },
      { label: "Camel", prompt: "Change the garment color to warm camel tan." },
      { label: "Blush", prompt: "Change the garment color to soft blush pink." },
      { label: "Olive", prompt: "Change the garment color to military olive green." },
    ],
    colors: [
      { label: "Black", hex: "#0E0E12" },
      { label: "White", hex: "#F5F2EA" },
      { label: "Burgundy", hex: "#5B1F2E" },
      { label: "Sage", hex: "#A9B89A" },
      { label: "Navy", hex: "#1F2E54" },
      { label: "Camel", hex: "#B0875A" },
      { label: "Blush", hex: "#E8C9C2" },
      { label: "Olive", hex: "#5A6042" },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "Sparkles",
    description: "Belts, brooches, scarves, jewelry.",
    presets: [
      { label: "Leather belt", prompt: "Add a thin leather belt at the waist." },
      { label: "Brooch", prompt: "Add an ornate vintage brooch at the collar." },
      { label: "Silk scarf", prompt: "Add a silk scarf tied at the neck." },
      { label: "Statement necklace", prompt: "Add a chunky statement necklace." },
      { label: "Shoulder pads", prompt: "Add structured shoulder pads for a stronger silhouette." },
      { label: "Remove", prompt: "Remove all accessories." },
    ],
  },
];

export const EDITABLE_COMPONENT_MAP: Record<EditableComponent, EditableComponentSpec> =
  EDITABLE_COMPONENTS.reduce(
    (acc, c) => {
      acc[c.id] = c;
      return acc;
    },
    {} as Record<EditableComponent, EditableComponentSpec>
  );

/** Example prompts shown in the empty prompt-input state. */
export const SUGGESTED_PROMPTS: string[] = [
  "Make the sleeves puffier.",
  "Replace the buttons with gold buttons.",
  "Add embroidery around the neckline.",
  "Turn this into a cropped jacket.",
  "Change the color to burgundy.",
  "Add a leather belt at the waist.",
  "Shorten the hem to mini length.",
  "Add a floral print.",
];
