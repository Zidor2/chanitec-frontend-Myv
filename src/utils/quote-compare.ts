import { LaborItem, Quote, SupplyItem } from '../models/Quote';

const EPS = 1e-4;

function nEq(a: number, b: number): boolean {
  return Math.abs(Number(a) - Number(b)) < EPS;
}

function normRemise(r: number | undefined): number {
  return r === undefined || r === null ? 0 : Number(r);
}

function supplyFingerprint(items: SupplyItem[]) {
  return [...items]
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((i) => ({
      item_id: i.item_id ?? '',
      description: i.description ?? '',
      quantity: Number(i.quantity),
      priceEuro: Number(i.priceEuro)
    }));
}

function laborFingerprint(items: LaborItem[]) {
  return [...items]
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((i) => ({
      description: i.description ?? '',
      nbTechnicians: Number(i.nbTechnicians),
      nbHours: Number(i.nbHours),
      weekendMultiplier: Number(i.weekendMultiplier),
      priceEuro: Number(i.priceEuro)
    }));
}

/** Compare user-meaningful fields; ignores ids, timestamps, and derived totals. */
export function quotesContentEqual(a: Quote | null, b: Quote | null): boolean {
  if (!a || !b) return a === b;

  if (
    a.clientName !== b.clientName ||
    a.siteName !== b.siteName ||
    a.object !== b.object ||
    a.date !== b.date ||
    a.supplyDescription !== b.supplyDescription ||
    a.laborDescription !== b.laborDescription ||
    !nEq(a.supplyExchangeRate, b.supplyExchangeRate) ||
    !nEq(a.supplyMarginRate, b.supplyMarginRate) ||
    !nEq(a.laborExchangeRate, b.laborExchangeRate) ||
    !nEq(a.laborMarginRate, b.laborMarginRate) ||
    normRemise(a.remise) !== normRemise(b.remise)
  ) {
    return false;
  }

  const ac = a.confirmed === true;
  const bc = b.confirmed === true;
  if (ac !== bc) return false;
  if ((a.number_chanitec ?? '') !== (b.number_chanitec ?? '')) return false;

  const sa = supplyFingerprint(a.supplyItems ?? []);
  const sb = supplyFingerprint(b.supplyItems ?? []);
  if (sa.length !== sb.length) return false;
  for (let i = 0; i < sa.length; i++) {
    const x = sa[i];
    const y = sb[i];
    if (
      x.item_id !== y.item_id ||
      x.description !== y.description ||
      !nEq(x.quantity, y.quantity) ||
      !nEq(x.priceEuro, y.priceEuro)
    ) {
      return false;
    }
  }

  const la = laborFingerprint(a.laborItems ?? []);
  const lb = laborFingerprint(b.laborItems ?? []);
  if (la.length !== lb.length) return false;
  for (let i = 0; i < la.length; i++) {
    const x = la[i];
    const y = lb[i];
    if (
      x.description !== y.description ||
      !nEq(x.nbTechnicians, y.nbTechnicians) ||
      !nEq(x.nbHours, y.nbHours) ||
      !nEq(x.weekendMultiplier, y.weekendMultiplier) ||
      !nEq(x.priceEuro, y.priceEuro)
    ) {
      return false;
    }
  }

  return true;
}

export function cloneQuoteSnapshot(q: Quote): Quote {
  return JSON.parse(JSON.stringify(q)) as Quote;
}
