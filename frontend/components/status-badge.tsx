import { Badge } from "@/components/ui/badge";

function getStatusClass(status: string) {
  switch (status) {
    case "Open":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Resolved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Closed":
      return "bg-slate-200 text-slate-700 border-slate-300";
    case "Critical":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "High":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Low":
      return "bg-lime-100 text-lime-700 border-lime-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge className={getStatusClass(value)}>{value}</Badge>;
}
