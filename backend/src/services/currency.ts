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

// We will use a free API like ExchangeRate-API or similar
// For now, this is a simulated service that "fetches" rates
// In production, replace with real API call
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

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
  if (from === to) return amount;

  // Get rates relative to USD
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

  // Logic: Amount / FromRate = USD Value
  // USD Value * ToRate = Target Value
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  return parseFloat(converted.toFixed(2));
}
