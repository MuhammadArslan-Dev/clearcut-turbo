import { afterEach, describe, expect, it, vi } from "vitest";

const hosts = vi.hoisted(() => ({ allowed: true }));
vi.mock("@clearcut/utils/analytics-hosts", () => ({ analyticsAllowedHere: () => hosts.allowed }));

import { DEFAULT_EXPERIMENT_DEPLOYMENT_KEY, experimentDeploymentKey, experimentsEnabled } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
  hosts.allowed = true;
});

describe("experimentDeploymentKey", () => {
  it("is the hardcoded client key when the env var is empty or unset", () => {
    expect(DEFAULT_EXPERIMENT_DEPLOYMENT_KEY).toMatch(/^client-[A-Za-z0-9]{20,}$/);
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", "");
    expect(experimentDeploymentKey()).toBe(DEFAULT_EXPERIMENT_DEPLOYMENT_KEY);
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", "   ");
    expect(experimentDeploymentKey()).toBe(DEFAULT_EXPERIMENT_DEPLOYMENT_KEY);
  });

  it("an env var overrides it (another deployment for that build)", () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", " client-other ");
    expect(experimentDeploymentKey()).toBe("client-other");
  });

  it('the literal "off" switches the SDK off for that build', () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", "off");
    expect(experimentDeploymentKey()).toBe("");
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", "OFF");
    expect(experimentDeploymentKey()).toBe("");
  });
});

describe("experimentsEnabled", () => {
  it("needs Amplitude analytics itself on AND an allowed host (the key alone is never enough)", () => {
    // on by default: the env var is only an opt-out ("false")
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_ENABLED", "");
    expect(experimentsEnabled()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_ENABLED", "true");
    expect(experimentsEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_ENABLED", "false");
    expect(experimentsEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_ENABLED", "true");
    hosts.allowed = false; // localhost / preview hosts without the opt-in
    expect(experimentsEnabled()).toBe(false);
  });

  it('is off when the build says "off"', () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY", "off");
    expect(experimentsEnabled()).toBe(false);
  });
});
