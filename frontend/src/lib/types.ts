// Shared types for the AI Fashion Studio

import type { MaterialId } from "./materials";

export type ComparisonMode = "before-after" | "side-by-side" | "slider";

export type GarmentCategory =
  | "all"
  | "dresses"
  | "tops"
  | "outerwear"
  | "bottoms"
  | "knitwear"
  | "accessories";

export interface Garment {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  category: Exclude<GarmentCategory, "all">;
  price: number;
  currency: string;
  image: string; // URL to garment product image
  description: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  featured?: boolean;
  inStock: boolean;
  /** Primary fabric/material — informs AI generation */
  material?: MaterialId;
}

export interface Designer {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar: string; // image URL
  coverImage: string;
  location: string;
  specialties: string[];
  collectionCount: number;
  rating: number;
  verified: boolean;
}

export interface SavedLook {
  id: string;
  createdAt: number;
  personImage: string; // data URL
  garmentImage: string; // data URL or URL
  resultImage: string; // data URL
  garmentName: string;
  designerName: string;
  price: number;
  currency: string;
  comparisonMode: ComparisonMode;
  material?: MaterialId;
}

export interface FitAnalysis {
  estimated_fit: "true_to_size" | "runs_small" | "runs_large";
  sleeve_note: string;
  waist_note: string;
  recommended_size: string | null;
  style_match_pct: number;
}

export interface TryOnRequest {
  /** base64 data URL or remote URL of the person photo */
  person_image: string;
  /** Optional: product id from the marketplace */
  product_id?: number | string;
  /** Optional: explicit garment image when not using a product */
  garment_image?: string;
  /** Selected fabric material override */
  material?: MaterialId;
  /** Person height in cm for measurement estimation (default 170) */
  height_cm?: number;
}

export interface TryOnResponse {
  success: boolean;
  result_image?: string;
  fit_analysis?: FitAnalysis;
  fit_confidence?: number;
  model?: string;
  generation_id?: number;
  error?: string;
  hint?: string;
}

// ===========================================================================
// AI Fashion Playground — live editing workspace
// ===========================================================================

/** Editable garment components the user can modify in the Playground. */
export type EditableComponent =
  | "sleeves"
  | "collar"
  | "neckline"
  | "buttons"
  | "zippers"
  | "pockets"
  | "hemline"
  | "length"
  | "embroidery"
  | "prints"
  | "colors"
  | "accessories";

/** A single edit applied to an image. */
export interface EditAction {
  id: string;
  /** ISO timestamp */
  createdAt: number;
  /** Natural-language description of the edit, e.g. "Make the sleeves puffier" */
  prompt: string;
  /** Which editable component this edit targets (if any) */
  component?: EditableComponent;
  /** The image BEFORE this edit was applied */
  beforeImage: string;
  /** The image AFTER this edit was applied */
  afterImage: string;
  /** "user" for free-text prompts, "preset" for chip clicks, "component" for visual controls */
  source: "user" | "preset" | "component";
}

export interface EditRequest {
  /** The image to edit (data URL or http URL) */
  image: string;
  /** Natural-language edit instructions */
  prompt: string;
  /** Optional: the editable component being modified (gives the AI a focus area) */
  component?: EditableComponent;
  /** Optional: preserve the person's face & pose (default true) */
  preservePerson?: boolean;
}

export interface EditResponse {
  success: boolean;
  resultImage?: string; // base64 data URL
  error?: string;
  meta?: {
    durationMs: number;
    model: string;
  };
}

// ===========================================================================
// Smart Shopping Marketplace — e-commerce experience
// ===========================================================================

export interface ProductReview {
  id: string;
  author: string;
  avatar?: string;
  rating: number; // 1–5
  title: string;
  body: string;
  createdAt: number; // epoch ms
  verified: boolean; // verified purchase
  helpful: number;
  size?: string; // size purchased
  fit?: "runs-small" | "true-to-size" | "runs-large";
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  /** Seller / designer name (display) */
  sellerName: string;
  sellerId: string;
  category: Exclude<GarmentCategory, "all">;
  price: number;
  /** Original price if on sale */
  originalPrice?: number;
  currency: string;
  description: string;
  /** Multiple product images for the carousel */
  images: ProductImage[];
  /** Backwards-compat single image (used by older Studio flow) */
  image: string;
  colors: { name: string; hex: string }[];
  sizes: { label: string; inStock: boolean }[];
  tags: string[];
  featured?: boolean;
  /** Aggregate availability state */
  availability: "in-stock" | "low-stock" | "preorder" | "sold-out";
  /** Units remaining (drives "Only N left" badges) */
  stockCount: number;
  /** Average rating from reviews */
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  material?: MaterialId;
  /** Free shipping threshold / shipping info */
  shipsFrom: string;
  shipsWithin: string;
  returns: string;
}

export interface StylingSuggestion {
  id: string;
  title: string;
  description: string;
  occasion: string;
  pairing: string[];
}

export interface StylingsuggestionsRequest {
  productId: string;
  productImage: string;
  productName: string;
  productDescription: string;
}

export interface StylingsuggestionsResponse {
  success: boolean;
  suggestions?: StylingSuggestion[];
  error?: string;
}

export interface CheckoutItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  sellerName?: string;
  sellerId?: string;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  shipping: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment?: {
    cardName: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
  };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  error?: string;
  eta?: string;
  virtual_account?: {
    account_number: string;
    bank_name: string;
    amount: string;
    expires_at: string;
    transaction_id: number;
  };
}

export interface ReviewSubmission {
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  size?: string;
  fit?: "runs-small" | "true-to-size" | "runs-large";
}

export interface ReviewSubmissionResponse {
  success: boolean;
  review?: ProductReview;
  error?: string;
}

// ===========================================================================
// Payment & ALATPay Integration
// ===========================================================================

export interface VirtualAccountResponse {
  status: boolean;
  data?: {
    transaction_id: number;
    alatpay_transaction_id: string;
    virtual_account_number: string;
    virtual_bank_name: string;
    amount: string;
    expired_at: string;
  };
  error?: string;
}

export interface PaymentStatusResponse {
  status: boolean;
  data: {
    transaction_id: number;
    alatpay_transaction_id: string;
    status: string;
    amount: string;
    paid_at: string | null;
  };
}

// ===========================================================================
// Body Profile — persistent user measurements
// ===========================================================================

export interface BodyProfile {
  height_cm: number;
  weight_kg: number | null;
  body_shape: string;
  measurements: Record<string, number>;
  reference_image: string;
  created_at: string;
  updated_at: string;
}

export interface BodyProfileMeasureResponse {
  success: boolean;
  measurements: Record<string, number>;
  body_shape: string;
  hint?: string;
  error?: string;
  code?: string;
}

export interface TransactionRecord {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  order: number | null;
  alatpay_transaction_id: string;
  virtual_account_number: string;
  virtual_bank_name: string;
  amount: string;
  fee: string;
  net_amount: string;
  currency: string;
  status: string;
  payment_method: string;
  channel: string;
  created_at: string;
  paid_at: string | null;
}

export interface DesignerEarningRecord {
  id: number;
  designer: number;
  designer_username: string;
  transaction_id_display: string;
  order_item: Record<string, unknown>;
  amount: string;
  platform_fee: string;
  net_amount: string;
  status: string;
  created_at: string;
}

export interface EarningsSummary {
  total_earned: string;
  available: string;
  pending: string;
  paid_out: string;
  total_transactions: number;
}

export interface PayoutRecord {
  id: number;
  designer: number;
  designer_username: string;
  amount: string;
  status: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  reference: string;
  note: string;
  paid_at: string | null;
  created_at: string;
}

export interface PayoutMethodRecord {
  id: number;
  user: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_default: boolean;
}

export interface AdminDashboardSummary {
  total_revenue: string;
  pending_payouts: string;
  total_commission: string;
  total_transactions: number;
  paid_transactions: number;
  total_designers: number;
  pending_payout_count: number;
  queues?: {
    pending_designer_applications: number;
    pending_product_reviews: number;
    open_disputes: number;
    pending_payouts: number;
  };
  ai_health_7d?: {
    generations: number;
    completed: number;
    failed: number;
    success_rate: number;
    avg_latency_ms: number;
  };
  growth?: {
    new_users_7d: number;
    new_users_30d: number;
    new_designers_30d: number;
    new_products_30d: number;
    paid_transactions_30d: number;
  };
}

export interface AdminDesignerApplication {
  id: number;
  brand_name: string;
  bio: string;
  portfolio_links: string[];
  status: "pending" | "approved" | "rejected";
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string;
    is_designer: boolean;
  };
  reviewed_by: string | null;
}

export interface AdminPendingProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  images: unknown[];
  image_url: string | null;
  designer_id: number | null;
  designer_name: string | null;
  category: string | null;
  material: string;
  fit_type: string;
  sizes: string[];
  colors: string[];
  moderation_status: "draft" | "pending_review" | "published" | "rejected";
  rejection_reason: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAIHealth {
  window_days: number;
  totals: {
    generations: number;
    completed: number;
    failed: number;
    processing: number;
    success_rate: number;
  };
  failures_by_reason: { reason: string; count: number }[];
  latency_ms: { avg: number; fastest: number; slowest: number };
  recent_failures: {
    id: number;
    created_at: string;
    failure_reason: string;
    error: string;
    latency_ms: number;
    user_username: string;
    product_name: string | null;
    model: string;
  }[];
}

export interface AdminGeneration {
  id: number;
  user: number;
  user_username: string;
  product: number | null;
  product_name: string | null;
  person_image: string;
  garment_image: string;
  result_image: string;
  fit_analysis: Record<string, unknown>;
  fit_confidence: number;
  status: "pending" | "processing" | "completed" | "failed";
  error: string;
  failure_reason: string;
  latency_ms: number;
  model: string;
  flagged: boolean;
  created_at: string;
}

export interface AdminDispute {
  id: number;
  order: number;
  order_status: string;
  order_total: string;
  user: number;
  user_username: string;
  reason: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  resolution_notes: string;
  resolved_by: number | null;
  resolved_by_username: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InitiatePaymentRequest {
  amount: number;
  order_id: string;
  description?: string;
  customer_email: string;
  customer_phone?: string;
  customer_first_name?: string;
  customer_last_name?: string;
}

// ===========================================================================
// AI Smart Search — natural-language product search
// ===========================================================================

export interface SmartSearchFilters {
  occasion?: string;
  maxPrice?: number;
  minPrice?: number;
  /** Currency code inferred from the query (USD, NGN, EUR, GBP…) */
  currency?: string;
  category?: GarmentCategory;
  colors?: string[];
  sizes?: string[];
  /** Skin-tone / hair / body hints the user mentioned */
  audienceHint?: string;
  /** Gender hint (e.g. "for a man", "for her") */
  genderHint?: string;
  /** Free-text keywords extracted from the query */
  keywords?: string[];
}

export interface SmartSearchMatch {
  productId: string;
  /** 0–100 score */
  score: number;
  /** Short human-readable reason this product matches the query */
  reason: string;
  /** Which aspects of the query this product satisfies */
  matchedOn: string[];
}

export interface SmartSearchRequest {
  query: string;
  /** Currency the user wants prices displayed in (default USD) */
  displayCurrency?: string;
}

export interface SmartSearchResponse {
  success: boolean;
  /** Re-stated understanding of the user's intent */
  interpretation?: string;
  /** Structured filters extracted from the query */
  filters?: SmartSearchFilters;
  /** Ranked product matches with explanations */
  matches?: SmartSearchMatch[];
  /** Optional short AI-written intro to the results */
  summary?: string;
  error?: string;
  meta?: {
    durationMs: number;
    model: string;
  };
}

// ===========================================================================
// Digital Wardrobe — user-uploaded clothing, auto-categorized by AI
// ===========================================================================

export type WardrobeCategory =
  | "shirts"
  | "trousers"
  | "dresses"
  | "jackets"
  | "shoes"
  | "bags"
  | "watches"
  | "accessories";

export interface WardrobeItem {
  id: string;
  /** Data URL of the uploaded photo */
  image: string;
  /** AI-categorized type */
  category: WardrobeCategory;
  /** AI-generated name (e.g. "White cotton button-down shirt") */
  name: string;
  /** AI-detected dominant colors */
  colors: string[];
  /** AI-detected material/fabric */
  material?: string;
  /** AI-detected style tags (casual, formal, etc.) */
  styleTags: string[];
  /** AI-detected suitable seasons */
  seasons: string[];
  /** AI-detected dominant color hex for swatch display */
  dominantColorHex?: string;
  /** When the item was added */
  createdAt: number;
  /** Optional user-edited note */
  note?: string;
}

export interface WardrobeAnalysisRequest {
  image: string; // data URL
}

export interface WardrobeAnalysisResponse {
  success: boolean;
  item?: Omit<WardrobeItem, "id" | "image" | "createdAt">;
  error?: string;
}

// ===========================================================================
// AI Outfit Recommendation
// ===========================================================================

export type WeatherCondition =
  | "hot"
  | "warm"
  | "mild"
  | "cool"
  | "cold"
  | "rainy"
  | "snowy";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type DressCode =
  | "casual"
  | "smart-casual"
  | "business"
  | "formal"
  | "black-tie"
  | "creative";

export interface OutfitRecommendationRequest {
  occasion: string;
  weather: WeatherCondition;
  timeOfDay: TimeOfDay;
  dressCode: DressCode;
  /** Wardrobe items the AI can choose from */
  wardrobeItems: Array<{
    id: string;
    name: string;
    category: WardrobeCategory;
    colors: string[];
    styleTags: string[];
    seasons: string[];
  }>;
}

export interface OutfitRecommendation {
  /** Title for the look, e.g. "Sunday brunch in the park" */
  title: string;
  /** 1-2 sentence rationale */
  rationale: string;
  /** Items from the user's wardrobe that make up this outfit (by id) */
  wardrobeItemIds: string[];
  /** Marketplace items to fill gaps, if needed */
  marketplaceSuggestions: Array<{
    productId: string;
    reason: string;
  }>;
  /** Styling tips */
  stylingTips: string[];
}

export interface OutfitRecommendationResponse {
  success: boolean;
  outfits?: OutfitRecommendation[];
  error?: string;
  meta?: {
    durationMs: number;
    model: string;
  };
}
