/**
 * Smart categorization: suggest category from expense title/description.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["food", "restaurant", "dinner", "lunch", "breakfast", "cafe", "coffee", "swiggy", "zomato", "dominos"],
  Travel: ["travel", "uber", "ola", "petrol", "fuel", "flight", "train", "bus", "metro", "parking"],
  Shopping: ["shopping", "amazon", "flipkart", "mall", "store"],
  Entertainment: ["movie", "netflix", "spotify", "concert", "game", "entertainment"],
  Utilities: ["electricity", "broadband", "recharge", "bill", "utility", "jio", "airtel"],
  Groceries: ["grocery", "groceries", "vegetables", "supermarket", "bigbasket"],
  Health: ["health", "medicine", "pharmacy", "doctor", "hospital", "apollo"],
  Rent: ["rent", "lease", "housing"],
  Others: [],
};

export function suggestCategory(title: string, description?: string): string {
  const text = `${(title ?? "").toLowerCase()} ${(description ?? "").toLowerCase()}`;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Others") continue;
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return "Others";
}

export function getCategories(): string[] {
  return Object.keys(CATEGORY_KEYWORDS);
}
