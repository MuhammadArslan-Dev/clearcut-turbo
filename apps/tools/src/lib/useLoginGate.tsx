"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { getToken } from "@clearcut/auth/token";
import type { LoginGateConfig } from "./loginGate";

const ToolsAuthGate = dynamic(() => import("@/components/ToolsAuthGate"), { ssr: false });

/**
 * Gate any Tools action behind the shared OTP login without leaving the page.
 *
 *   const { requireLogin, gate } = useLoginGate();
 *   requireLogin(getLoginGateConfig("download", locale), () => download());
 *   ...
 *   return <>{...}{gate}</>;
 *
 * Already logged in -> the action runs immediately. Otherwise the lazy login
 * modal opens over the page (nothing navigates, so the tool's state — the
 * processed image, preset, crop — is untouched) and the action runs exactly
 * once after a successful verification. Closing the modal leaves the action
 * un-run; the next requireLogin replaces it.
 *
 * This is a UX gate, not access control: the work happens in the browser.
 */
export function useLoginGate() {
  const pending = useRef<(() => void) | null>(null);
  const [config, setConfig] = useState<LoginGateConfig | null>(null);
  const [requestId, setRequestId] = useState(0);

  const requireLogin = useCallback((cfg: LoginGateConfig, action: () => void) => {
    if (getToken()) {
      action();
      return;
    }
    pending.current = action;
    setConfig(cfg);
    setRequestId((n) => n + 1);
  }, []);

  const handleAuthenticated = useCallback(() => {
    const run = pending.current;
    pending.current = null;
    run?.();
  }, []);

  const gate: ReactNode = config ? (
    <ToolsAuthGate requestId={requestId} copy={config} onAuthenticated={handleAuthenticated} />
  ) : null;

  return { requireLogin, gate };
}
