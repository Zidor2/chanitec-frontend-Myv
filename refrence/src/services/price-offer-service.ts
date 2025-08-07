import { PriceOffer, PriceOfferCreationDTO } from '../models/PriceOffer';
import { Quote } from '../models/Quote';

const STORAGE_KEY = 'price_offers';

class PriceOfferService {
  private getFromStorage(): PriceOffer[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(data: PriceOffer[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  createFromQuote(quote: Quote): PriceOffer {
    const now = new Date().toISOString();
    const priceOffer: PriceOffer = {
      quoteId: quote.id,
      clientName: quote.clientName,
      siteName: quote.siteName,
      object: quote.object,
      date: quote.date,
      supplyDescription: quote.supplyDescription,
      supplyTotalHT: quote.totalSuppliesHT,
      laborDescription: quote.laborDescription,
      laborTotalHT: quote.totalLaborHT,
      totalHT: quote.totalHT,
      tva: quote.tva,
      totalTTC: quote.totalTTC,
      createdAt: now,
      updatedAt: now
    };

    const priceOffers = this.getFromStorage();
    // Remove any existing price offer for this quote
    const filteredOffers = priceOffers.filter(po => po.quoteId !== quote.id);
    // Add the new price offer
    filteredOffers.push(priceOffer);
    this.saveToStorage(filteredOffers);

    return priceOffer;
  }

  getByQuoteId(quoteId: string): PriceOffer | undefined {
    const priceOffers = this.getFromStorage();
    return priceOffers.find(po => po.quoteId === quoteId);
  }

  getAll(): PriceOffer[] {
    return this.getFromStorage();
  }

  delete(quoteId: string): boolean {
    const priceOffers = this.getFromStorage();
    const filteredOffers = priceOffers.filter(po => po.quoteId !== quoteId);

    if (filteredOffers.length !== priceOffers.length) {
      this.saveToStorage(filteredOffers);
      return true;
    }
    return false;
  }
}

export const priceOfferService = new PriceOfferService();