import { prisma } from "../lib/prisma.js";
import fetch from "node-fetch";

// Fallback rates if API fails (approx markets)
const FALLBACK_RATES: Record<string, number> = {
  "USD": 1,
  "INR": 83.5,
  "EUR": 0.92,
  "GBP": 0.79,
  "JPY": 155.0,
  "AUD": 1.5,
  "CAD": 1.36,
  "CHF": 0.91,
  "CNY": 7.23,
  "SEK": 10.7,
  "NZD": 1.63,
};

export const SUPPORTED_CURRENCIES = Object.keys(FALLBACK_RATES).map(code => ({
  code,
  name: code, // In a real app, map codes to full names (e.g., USD -> US Dollar)
  symbol: code === "USD" ? "$" : code === "EUR" ? "€" : code === "INR" ? "₹" : code,
}));

// We will use a free API like ExchangeRate-API or similar
// For now, this is a simulated service that "fetches" rates
// In production, replace with real API call
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

/**
 * Get the exchange rate between two currencies.
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  // Get rates relative to USD from DB or fallback
  const [fromRateEntry, toRateEntry] = await Promise.all([
    prisma.exchangeRate.findUnique({
      where: { baseCurrency_targetCurrency: { baseCurrency: "USD", targetCurrency: from } },
    }),
    prisma.exchangeRate.findUnique({
      where: { baseCurrency_targetCurrency: { baseCurrency: "USD", targetCurrency: to } },
    }),
  ]);

  const fromRate = fromRateEntry?.rate.toNumber() || FALLBACK_RATES[from] || 1;
  const toRate = toRateEntry?.rate.toNumber() || FALLBACK_RATES[to] || 1;

  // Logic: 1 Unit From = (1 / FromRate) * ToRate
  return parseFloat(((1 / fromRate) * toRate).toFixed(4));
}

export async function updateExchangeRates() {
  try {
    console.log("Fetching latest exchange rates...");

    // In a real app, un-comment this fetch
    // const res = await fetch(EXCHANGE_API_URL);
    // const data = await res.json();
    // const rates = data.rates;

    // Simulated response for stability
    const rates = FALLBACK_RATES;

    const upserts = Object.entries(rates).map(([currency, rate]) => {
      // We store everything relative to USD for easier conversion
      return prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency: {
            baseCurrency: "USD",
            targetCurrency: currency,
          },
        },
        update: { rate: rate, lastUpdated: new Date() },
        create: {
          baseCurrency: "USD",
          targetCurrency: currency,
          rate: rate,
        },
      });
    });

    await prisma.$transaction(upserts);
    console.log(`Updated ${upserts.length} exchange rates.`);
  } catch (error) {
    console.error("Failed to update exchange rates:", error);
  }
}

/**
 * Convert an amount from one currency to another using stored rates.
 * Uses USD as the intermediate pivot.
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return parseFloat((amount * rate).toFixed(2));
}
