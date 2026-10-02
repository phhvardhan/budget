import { BookOpen, CalendarDays, LayoutGrid, ListOrdered, PieChart, Receipt } from "lucide-react";

export const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/activity", label: "Activity", icon: ListOrdered },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/year", label: "Year", icon: CalendarDays },
  { href: "/guide", label: "How it works", icon: BookOpen },
] as const;

export const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
