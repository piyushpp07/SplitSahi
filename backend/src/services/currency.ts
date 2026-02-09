import { prisma } from "../lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

// Free exchange rate API (no key required for basic usage)
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest";

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * Fetch exchange rates from API and cache them
 */
export async function fetchAndCacheRates(baseCurrency: string = "USD"): Promise<void> {
  try {
    const response = await fetch(`${EXCHANGE_API_URL}/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data = await response.json();
    const rates = data.rates as Record<string, number>;

    // Store rates in database
    const now = new Date();
    for (const [targetCurrency, rate] of Object.entries(rates)) {
      if (SUPPORTED_CURRENCIES.some(c => c.code === targetCurrency)) {
        await prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency: {
              baseCurrency,
              targetCurrency,
            },
          },
          update: {
            rate: new Decimal(rate),
            lastUpdated: now,
          },
          create: {
            baseCurrency,
            targetCurrency,
            rate: new Decimal(rate),
            lastUpdated: now,
          },
        });
      }
    }

    console.log(`[Currency] Cached ${Object.keys(rates).length} exchange rates for ${baseCurrency}`);
  } catch (error) {
    console.error("[Currency] Error fetching exchange rates:", error);
    throw error;
  }
}

/**
 * Get exchange rate from cache or fetch if stale
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Same currency = 1:1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    // Check cache
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_targetCurrency: {
          baseCurrency: fromCurrency,
          targetCurrency: toCurrency,
        },
      },
    });

    const now = new Date();
    const isCacheValid = cached && (now.getTime() - cached.lastUpdated.getTime()) < CACHE_DURATION_MS;

    if (!isCacheValid) {
      // Refresh cache
      await fetchAndCacheRates(fromCurrency);
      
      // Fetch again after refresh
      const refreshed = await prisma.exchangeRate.findUnique({
        where: {
          baseCurrency_targetCurrency: {
            baseCurrency: fromCurrency,
            targetCurrency: toCurrency,
          },
        },
      });

      if (!refreshed) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      return Number(refreshed.rate);
    }

    return Number(cached.rate);
  } catch (error) {
    console.error(`[Currency] Error getting exchange rate ${fromCurrency} -> ${toCurrency}:`, error);
    // Fallback: return 1 to avoid breaking the app
    return 1;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Convert a Decimal amount
 */
export async function convertDecimalCurrency(
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string
): Promise<Decimal> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount.mul(rate);
}

/**
 * Initialize currency service (fetch initial rates)
 */
export async function initCurrencyService(): Promise<void> {
  console.log("[Currency] Initializing currency service...");
  try {
    // Fetch rates for major base currencies
    await fetchAndCacheRates("USD");
    await fetchAndCacheRates("EUR");
    await fetchAndCacheRates("INR");
    console.log("[Currency] Currency service initialized successfully");
  } catch (error) {
    console.error("[Currency] Failed to initialize currency service:", error);
  }
}
