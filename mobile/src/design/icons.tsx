import type { ComponentType } from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleUserRound,
  FileCheck2,
  FileText,
  Home,
  Lock,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  RotateCw,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react-native"

export type IconName =
  | "alert-circle"
  | "alert-triangle"
  | "bar-chart-2"
  | "bell"
  | "calendar"
  | "check"
  | "check-circle"
  | "chevron-left"
  | "chevron-right"
  | "circle"
  | "circle-user"
  | "file-check"
  | "file-text"
  | "home"
  | "lock"
  | "message-circle"
  | "message-square"
  | "refresh-cw"
  | "rotate-cw"
  | "scale-balance"
  | "shield"
  | "shield-check"
  | "trending-up"
  | "user"

type LucideProps = {
  color: string
  size: number
  strokeWidth?: number
}

const lucideIcons: Record<Exclude<IconName, "scale-balance">, ComponentType<LucideProps>> = {
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "bar-chart-2": BarChart2,
  bell: Bell,
  calendar: Calendar,
  check: Check,
  "check-circle": CheckCircle,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  circle: Circle,
  "circle-user": CircleUserRound,
  "file-check": FileCheck2,
  "file-text": FileText,
  home: Home,
  lock: Lock,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  "refresh-cw": RefreshCw,
  "rotate-cw": RotateCw,
  shield: Shield,
  "shield-check": ShieldCheck,
  "trending-up": TrendingUp,
  user: User,
}

export function MFIcon({ name, color, size = 20, strokeWidth = 2.2 }: { name: IconName; color: string; size?: number; strokeWidth?: number }) {
  if (name === "scale-balance") {
    return <MaterialCommunityIcons name="scale-balance" size={size} color={color} />
  }

  const Icon = lucideIcons[name]
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />
}
