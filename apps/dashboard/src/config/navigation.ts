// config/navigation.ts

import { ComponentType } from "react";
import {
  FireIcon,
  ProfileIcon,
  GraduationCapIcon,
  ReferralIcon,
} from "@/components/ui/icons";

export type NavKey =
  | "exams"
  | "learn"
  | "dashboard"
  | "myCourses"
  | "payments"
  | "profile"
  | "referral";

export interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  variant?: "filled" | "outline";
}

export type NavItem = {
  key: NavKey;
  label: string;
  href:
    | "/dashboard"
    | "/dashboard/my-courses"
    | "/dashboard/payments"
    | "/dashboard/profile"
    | "/dashboard/referral";
  match?: "exact" | "startsWith";
  icon?: ComponentType<IconProps>;
  // Extra route prefixes that should light this tab up even though they
  // aren't under `href` (Daily Tests belongs to Learn, but its attempt/result
  // page lives outside /dashboard).
  activePrefixes?: string[];
};

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return (
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
    (item.activePrefixes?.some((p) => pathname.startsWith(p)) ?? false)
  );
}

export const mainNav: NavItem[] = [
  {
    key: "learn",
    label: "Learn",
    href: "/dashboard",
    match: "startsWith",
    icon: GraduationCapIcon,
    activePrefixes: ["/daily-tests", "/daily-test-attempt"],
  },
  {
    key: "exams",
    label: "Exams",
    href: "/dashboard/my-courses",
    match: "startsWith",
    icon: FireIcon,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    match: "startsWith",
    icon: ProfileIcon,
  },
  // {
  //   key: "referral",
  //   label: "Referral",
  //   href: "/dashboard/referral",
  //   match: "startsWith",
  //   icon: ReferralIcon,
  // },
];

export const secondaryNav: NavItem[] = [
  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    match: "startsWith",
  },
];

export const mobileNav: NavItem[] = [
  {
    key: "exams",
    label: "Exams",
    href: "/dashboard/my-courses",
    match: "startsWith",
    icon: FireIcon,
  },
  {
    key: "learn",
    label: "Learn",
    href: "/dashboard",
    match: "startsWith",
    icon: GraduationCapIcon,
    activePrefixes: ["/daily-tests", "/daily-test-attempt"],
  },

  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    match: "startsWith",
    icon: ProfileIcon,
  },
];
