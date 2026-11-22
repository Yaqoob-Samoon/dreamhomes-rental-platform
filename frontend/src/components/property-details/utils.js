// ---- Formatting Helpers ----
export function formatRentPKR(amount) {
  const n = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(n)) return null;
  return `PKR ${n.toLocaleString()}`;
}
