/**
 * ONE FILE — ALL QUERY PARAM USE CASES — NO CONFUSION
 *
 * Purpose:
 * - Canonical reference for using useQueryParams
 * - Shows correct get / set / remove patterns
 * - Prevents incorrect multi-set or dependency misuse
 *
 * NOTE:
 * - This file is NOT imported into production
 * - For documentation & onboarding only
 */

import { useEffect } from "react";
import { useQueryParams } from "./useQueryParam";

export function UseQueryParamsExamples() {
  const { get, getAll, set, remove } = useQueryParams();

  /* ============================================================================
     READ
  ============================================================================ */

  // Get a single query param
  const testType = get("testType"); // string | null

  // Get all query params
  const allParams = getAll(); // Record<string, string>

  /* ============================================================================
     SET — BASIC
  ============================================================================ */

  // Set a single param
  set({ page: 1 });

  // Set multiple params atomically (RECOMMENDED)
  set({
    testType: "chapter-tests",
    best: "best1",
  });

  /* ============================================================================
     SET — DEFAULTS (ON MOUNT)
  ============================================================================ */

  useEffect(() => {
    if (get("testType")) return;

    set({
      testType: "chapter-tests",
      best: "best1",
    });
  }, []);

  /* ============================================================================
     SET — PUSH vs REPLACE
  ============================================================================ */

  // Replace URL (default — no history entry)
  set({ page: 2 });

  // Push URL (adds history entry)
  set(
    { page: 3 },
    { replace: false }
  );

  /* ============================================================================
     SET — SCROLL CONTROL
  ============================================================================ */

  // Do not scroll (default)
  set({ filter: "math" });

  // Scroll to top after update
  set(
    { filter: "physics" },
    { scroll: true }
  );

  /* ============================================================================
     SET — EMPTY / NULL HANDLING
  ============================================================================ */

  // Remove param by setting null
  set({ filter: null });

  // Remove param by setting undefined
  set({ sort: undefined });

  // Empty string removes param (default behavior)
  set({ search: "" });

  // Preserve empty value explicitly
  set(
    { search: "" },
    { removeIfEmpty: false }
  );

  /* ============================================================================
     UPDATE PATTERNS
  ============================================================================ */

  // Toggle a param
  set({
    view: get("view") === "grid" ? "list" : "grid",
  });

  // Update filter + reset pagination
  set({
    filter: "difficulty_easy",
    page: 1,
  });

  /* ============================================================================
     REMOVE
  ============================================================================ */

  // Remove a single param
  remove("page");

  // Remove multiple params
  remove(["page", "filter", "sort"]);

  // Remove with push instead of replace
  remove("page", { replace: false });

  /* ============================================================================
     CLEAR ALL PARAMS
  ============================================================================ */

  remove(Object.keys(getAll()));

  /* ============================================================================
     SYNC UI WITH URL
  ============================================================================ */

  const activeTab = get("tab") ?? "overview";
  const currentPage = Number(get("page") ?? 1);

  /* ============================================================================
     ❌ ANTI-PATTERNS (DO NOT DO THIS)
  ============================================================================ */

  // ❌ DO NOT call set multiple times in same effect
  /*
  set({ testType: "sectional-tests" });
  set({ best: "best1" });
  */

  // ❌ DO NOT depend on get/set in useEffect unless intentional
  /*
  useEffect(() => {
    set({ page: 1 });
  }, [get]);
  */

  return null;
}
