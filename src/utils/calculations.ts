import { LaborItem, SupplyItem } from '../models/Quote';

/**
 * Rounds a number to two decimal places (for display purposes only)
 */
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the dollar price from euro price using the exchange rate
 * PR dollar = PR euro * exchange rate
 */
export const calculateDollarPrice = (euroPrice: number, exchangeRate: number): number => {
  return euroPrice * exchangeRate;
};

/**
 * Calculates the sales price by applying the margin rate to the purchase price
 * PV/U dollar = PR dollar / margin rate
 */
export const calculateSalesPrice = (purchasePrice: number, marginRate: number): number => {
  return purchasePrice / marginRate;
};

/**
 * Calculates the total price for a supply item
 */
export const calculateSupplyItemTotal = (
  item: SupplyItem,
  exchangeRate: number,
  marginRate: number
): SupplyItem => {
  // Ensure all values are numbers
  const validPriceEuro = Number(item.priceEuro) || 0;
  const validExchangeRate = Number(exchangeRate) || 1;
  const validMarginRate = Number(marginRate) || 1;
  const validQuantity = Number(item.quantity) || 0;

  // PR dollar = PR euro * exchange rate
  const priceDollar = calculateDollarPrice(validPriceEuro, validExchangeRate);

  // PV/U dollar = PR dollar / margin rate
  const unitPriceDollar = calculateSalesPrice(priceDollar, validMarginRate);

  // PV dollar total HT = PV/U * Quantity
  const totalPriceDollar = unitPriceDollar * validQuantity;

  return {
    ...item,
    priceDollar,
    unitPriceDollar,
    totalPriceDollar
  };
};

/**
 * Calculates the total price for a labor item
 */
export const calculateLaborItemTotal = (
  item: LaborItem,
  exchangeRate: number,
  marginRate: number
): LaborItem => {
  // Ensure all values are numbers
  const validPriceEuro = Number(item.priceEuro) || 0;
  const validExchangeRate = Number(exchangeRate) || 1;
  const validMarginRate = Number(marginRate) || 1;
  const validNbTechnicians = Number(item.nbTechnicians) || 0;
  const validNbHours = Number(item.nbHours) || 0;
  const validWeekendMultiplier = Number(item.weekendMultiplier) || 1;

  // PR dollar = PR euro * exchange rate
  const priceDollar = calculateDollarPrice(validPriceEuro, validExchangeRate);

  // PV/U dollar = PR dollar / margin rate
  const unitPriceDollar = calculateSalesPrice(priceDollar, validMarginRate);

  // PV dollar total HT = PV/U * nbTechnicians * nbHours * weekendMultiplier
  const totalPriceDollar = unitPriceDollar * validNbTechnicians * validNbHours * validWeekendMultiplier;

  return {
    ...item,
    priceDollar,
    unitPriceDollar,
    totalPriceDollar
  };
};

/**
 * Calculates the total supplies price
 */
export const calculateTotalSupplies = (items: SupplyItem[]): number => {
  return items.reduce((total, item) => {
    const itemTotal = Number(item.totalPriceDollar) || 0;
    return total + itemTotal;
  }, 0);
};

/**
 * Calculates the total labor price
 */
export const calculateTotalLabor = (items: LaborItem[]): number => {
  return items.reduce((total, item) => {
    const itemTotal = Number(item.totalPriceDollar) || 0;
    return total + itemTotal;
  }, 0);
};

/**
 * Calculates VAT (16%)
 */
export const calculateVAT = (amount: number): number => {
  return amount * 0.16;
};

/**
 * Calculates the total TTC (including VAT)
 */
export const calculateTotalTTC = (totalHT: number): number => {
  const validTotalHT = Number(totalHT) || 0;
  return validTotalHT + calculateVAT(validTotalHT);
};

/**
 * Calculates the total with remise applied
 */
export const calculateTotalWithRemise = (totalHT: number, remise: number = 0): number => {
  const validTotalHT = Number(totalHT) || 0;
  const validRemise = Number(remise) || 0;
  const remiseAmount = validTotalHT * (validRemise / 100);
  return validTotalHT - remiseAmount;
};

/**
 * Calculates the total TTC with remise applied
 */
export const calculateTotalTTCWithRemise = (totalHT: number, remise: number = 0): number => {
  const totalWithRemise = calculateTotalWithRemise(totalHT, remise);
  return totalWithRemise + calculateVAT(totalWithRemise);
};