import {
  Home,
  Calendar,
  Edit3 as Compose,
  Image,
  BarChart3 as Analytics,
  Settings,
  Users,
  Activity,
  Bot,
  Shield,
  CreditCard,
  Layers,
  Hash,
  Eye,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Kalender", href: "/calendar", icon: Calendar },
  { label: "Komposisi", href: "/compose", icon: Compose },
  { label: "Media", href: "/media", icon: Image },
  { label: "Analitik", href: "/analytics", icon: Analytics, badgeKey: "analytics" },
  { label: "SK AI", href: "/sk", icon: Bot },
  { label: "Saran", href: "/suggestions", icon: Bot, badgeKey: "suggestions" },
  { label: "Engagement", href: "/engagement", icon: MessageSquare, badgeKey: "engagement" },
  { label: "Pilar", href: "/pillars", icon: Layers },
  { label: "Hashtag", href: "/hashtags", icon: Hash },
  { label: "Kompetitor", href: "/competitors", icon: Eye },
  { label: "Tim", href: "/team", icon: Users },
  { label: "Aktivitas", href: "/activity", icon: Activity },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Keamanan", href: "/security", icon: Shield },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export const COLLAPSED_WIDTH = 64;
export const EXPANDED_WIDTH = 220;
