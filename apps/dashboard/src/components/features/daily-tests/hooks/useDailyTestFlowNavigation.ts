// Daily Test flow (Learn → List → Attempt → History → Result) uses the
// shared origin-aware navigation hook — see hooks/navigation/useFlowNavigation
// for how history entries are tagged and why goUp() pops instead of pushing.
export { useFlowNavigation as useDailyTestFlowNavigation } from "@/hooks/navigation/useFlowNavigation";
