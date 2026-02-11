import { Decimal } from "@prisma/client/runtime/library";

export function toDecimal(n: number | string): Decimal {
    const num = Number(n);
    if (!isFinite(num)) return new Decimal(0);
    return new Decimal(num.toFixed(2));
}
