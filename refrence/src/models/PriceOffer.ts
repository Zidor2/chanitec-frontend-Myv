export interface PriceOffer {
  quoteId: string;
  clientName: string;
  siteName: string;
  object: string;
  date: string;
  supplyDescription: string;
  supplyTotalHT: number;
  laborDescription: string;
  laborTotalHT: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  createdAt: string;
  updatedAt: string;
}

export type PriceOfferCreationDTO = Omit<PriceOffer, 'createdAt' | 'updatedAt'>;