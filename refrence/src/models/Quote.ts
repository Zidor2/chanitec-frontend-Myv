/**
 * Represents an item in the quote's supplies section
 */
export interface SupplyItem {
  id: string;
  quote_id?: string;
  description: string;
  quantity: number;
  priceEuro: number; // Price in Euro (PR €)
  priceDollar?: number; // Price in Dollar (PR $)
  unitPriceDollar?: number; // Unit price in Dollar (PV/u $)
  totalPriceDollar?: number; // Total price in Dollar (PV $ Total HT)
}

/**
 * Represents a labor item in the quote
 */
export interface LaborItem {
  id: string;
  quote_id?: string;
  description: string;
  nbTechnicians: number;
  nbHours: number;
  weekendMultiplier: number; // 1 or 1.6
  priceEuro: number; // Price in Euro (PR €)
  priceDollar?: number; // Price in Dollar (PR $)
  unitPriceDollar?: number; // Unit price in Dollar (PV/u $)
  totalPriceDollar?: number; // Total price in Dollar (PV $ Total HT)
}

/**
 * Represents a client
 */
export interface Client {
  id: string;
  name: string;
  sites: Site[];
  Taux_marge?: number; // Margin rate for the client
}

export interface Split {
  Code:string
  name: string;
  description: string;
  puissance: number;
  site:string
}
/**
 * Represents a site belonging to a client
 */
export interface Site {
  id: string;
  name: string;
  client_id: string;
  splits?: Split[];
}

/**
 * Main Quote interface
 */
export interface Quote {
  id: string;
  clientName: string;
  siteName: string;
  object: string;
  date: string;

  // Items
  supplyItems: SupplyItem[];
  laborItems: LaborItem[];

  // Descriptions
  supplyDescription: string;
  laborDescription: string;

  // Rate coefficients
  supplyExchangeRate: number;
  supplyMarginRate: number;
  laborExchangeRate: number;
  laborMarginRate: number;

  // Calculated totals (these can be computed but stored for convenience)
  totalSuppliesHT: number;
  totalLaborHT: number;
  totalHT: number;
  tva: number;
  totalTTC: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;

  reminderDate?: string;
  tempReminderDays?: number; // Temporary field for UI state

  confirmed?: boolean;

  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';

  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };

  parentId?: string; // Reference to the parent quote if this is a revision
  number_chanitec?: string;
}

/**
 * Quote creation DTO - Data Transfer Object for creating new quotes
 * Omits calculated fields and IDs that will be generated
 */
export type QuoteCreationDTO = Omit<
  Quote,
  'id' | 'totalSuppliesHT' | 'totalLaborHT' | 'totalHT' | 'tva' | 'totalTTC' | 'createdAt' | 'updatedAt'
>;