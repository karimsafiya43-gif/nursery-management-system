// Local date as YYYY-MM-DD (avoids the UTC off-by-one problem in India mornings)
export const today = () => new Date().toLocaleDateString("en-CA");

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export const money = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);

// Date rule from the team plan: not before the sow date, not in the future.
// (The backend checks this too; this just gives instant feedback.)
export function dateError(date: string, sownDate?: string): string {
  if (!date) return "Choose a date.";
  if (date > today()) return "The date cannot be in the future.";
  if (sownDate && date < sownDate) return `The date cannot be before the sow date (${formatDate(sownDate)}).`;
  return "";
}
