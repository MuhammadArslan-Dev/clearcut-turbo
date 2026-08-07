"use client"

import { SectionId } from "@/utils/sections"


export function useScrollToSection(offset: number = 80) {
  const scrollToSection = (id: SectionId ) => {
    const element = document.getElementById(id)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return scrollToSection
}
