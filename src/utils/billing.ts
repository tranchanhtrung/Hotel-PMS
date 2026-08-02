export interface LineCalculation {
  unitPrice: number;
  quantity: number;
  itemBase: number; // Unit Price x Quantity
  serviceChargeRate: number; // e.g. 5 (%)
  vatRate: number; // e.g. 10 (%)
  serviceChargeAmount: number; // Item Base x Service charge rate
  subtotalWithService: number; // Item Base + Service charge
  vatAmount: number; // (Item Base + Service charge) x VAT rate
  lineTotal: number; // Item Base + Service charge + VAT
}

export function calculateItemLine(
  itemAmount: number,
  category?: string,
  serviceChargeRate: number = 5,
  vatRate: number = 10,
  unitPrice?: number,
  quantity?: number
): LineCalculation {
  const qty = quantity && quantity > 0 ? quantity : 1;
  const price = unitPrice !== undefined && unitPrice !== null && !isNaN(unitPrice)
    ? unitPrice
    : (itemAmount ? itemAmount / qty : 0);
  const base = price * qty;

  // Standard charge items receive Service Charge & VAT unless category is explicitly "payment" or "tax"
  const isStandardCharge = category !== "payment" && category !== "tax";
  const svcRate = isStandardCharge ? (serviceChargeRate || 0) : 0;
  const taxR = isStandardCharge ? (vatRate || 0) : 0;

  const serviceChargeAmount = base * (svcRate / 100);
  const subtotalWithService = base + serviceChargeAmount;
  const vatAmount = subtotalWithService * (taxR / 100);
  const lineTotal = subtotalWithService + vatAmount;

  return {
    unitPrice: price,
    quantity: qty,
    itemBase: base,
    serviceChargeRate: svcRate,
    vatRate: taxR,
    serviceChargeAmount,
    subtotalWithService,
    vatAmount,
    lineTotal
  };
}

export function calculateFolioTotals(
  items: Array<{ amount: number; category?: string; unitPrice?: number; quantity?: number }>,
  payments: Array<{ amount: number }>,
  serviceChargeRate: number = 5,
  vatRate: number = 10
) {
  let totalItemBase = 0;
  let totalServiceCharge = 0;
  let totalVat = 0;
  let totalCharges = 0;

  (items || []).forEach((item) => {
    const calc = calculateItemLine(item.amount, item.category, serviceChargeRate, vatRate, item.unitPrice, item.quantity);
    totalItemBase += calc.itemBase;
    totalServiceCharge += calc.serviceChargeAmount;
    totalVat += calc.vatAmount;
    totalCharges += calc.lineTotal;
  });

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = totalCharges - totalPaid;

  return {
    totalItemBase,
    totalServiceCharge,
    totalVat,
    totalCharges,
    totalPaid,
    balanceDue
  };
}
