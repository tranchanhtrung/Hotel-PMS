export function formatVND(amount: number | undefined | null, includeSuffix: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSuffix ? "0.000 VNĐ" : "0.000";
  }
  if (amount === 0) {
    return includeSuffix ? "0.000 VNĐ" : "0.000";
  }
  // If amount is small (e.g. 450, 600, 750, 1100), scale up from thousands unit (1.000 VNĐ)
  const fullAmount = (amount > 0 && amount < 10000) ? Math.round(amount * 1000) : Math.round(amount);
  const formatted = fullAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return includeSuffix ? `${formatted} VNĐ` : formatted;
}

export function parseVNDInput(inputVal: string | number): number {
  if (typeof inputVal === "number") return inputVal;
  if (!inputVal) return 0;
  // Strip dots, commas, spaces, currency symbols
  const cleaned = inputVal.toString().replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
}
