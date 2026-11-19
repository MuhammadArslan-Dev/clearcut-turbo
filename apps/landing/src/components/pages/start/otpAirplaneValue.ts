// Phase 120: A/B test "paper-airplane OTP wait + resend interaction" on /start. The assignment comes from GrowthBook (String flag
// below: "control" = today's OTP step, "airplane" = the variant). Pure file, no React. Details: docs/phases/120.

export const OTP_AIRPLANE_FLAG = "lp_all_otp_airplane_202611";
/** Control: exactly what learners get today. */
export const OTP_AIRPLANE_CONTROL = "control";
export const OTP_AIRPLANE_VARIANT = "airplane";

/** Only the explicit "airplane" turns the variant on; flag off / missing / unreachable / any other value keeps today's OTP step. */
export function isAirplaneValue(value: unknown): boolean {
  return value === OTP_AIRPLANE_VARIANT;
}

/** The properties that tag the funnel events of a learner who is IN the experiment (never added for anyone else). */
export type OtpExperimentProps = {
  experiment_flag: string;
  experiment_variant: "control" | "airplane";
  experiment_id: string;
};

export function buildExperimentProps(args: { inExperiment: boolean; value: unknown; experimentId: string }): OtpExperimentProps | null {
  if (!args.inExperiment) return null;
  return {
    experiment_flag: OTP_AIRPLANE_FLAG,
    experiment_variant: isAirplaneValue(args.value) ? "airplane" : "control",
    experiment_id: args.experimentId,
  };
}
