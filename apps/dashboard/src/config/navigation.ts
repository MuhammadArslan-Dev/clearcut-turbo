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
};

export const mainNav: NavItem[] = [
  {
    key: "learn",
    label: "Learn",
    href: "/dashboard",
    match: "startsWith",
    icon: GraduationCapIcon,
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
  },

  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    match: "startsWith",
    icon: ProfileIcon,
  },
];
