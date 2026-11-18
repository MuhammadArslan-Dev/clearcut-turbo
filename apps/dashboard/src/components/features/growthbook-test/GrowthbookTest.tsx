"use client";

// CC-192 QA page: shows ONE of two cards depending on a GrowthBook string flag, so the team can practise per-user targeting
// (attribute `user_id` = the logged-in user's users.uuid) before a real experiment goes live. Not linked from any flow.
// English only on purpose, like the other QA-only page (animation-preview); the route is 404 in production, see page.tsx.
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getExperiments, useExperimentValue } from "@/lib/experiments";

/** GrowthBook feature key (String): "old" = control, "new" = the other card. Naming: <surface>_<exam|all>_<what>_<yyyymm>. */
export const TEST_CARD_FLAG = "dash_all_test_card_202611";

function OldCard() {
  return (
    <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12} className="!h-auto" data-testid="gb-card-old">
      <div className="flex flex-col gap-2">
        <Text as="p" variant="body-small" className="text-surface-gray-muted">Card A</Text>
        <Text as="h2" variant="heading-medium" weight="semibold">Old card</Text>
        <Text as="p" variant="body-medium">This is the current card. Everyone sees it unless GrowthBook serves the value &quot;new&quot;.</Text>
      </div>
    </Card>
  );
}

function NewCard() {
  return (
    <Card bgcolor="white" border="border-brand" padding="20px" borderRadius={12} className="!h-auto" data-testid="gb-card-new">
      <div className="flex flex-col gap-2">
        <Text as="p" variant="body-small" className="text-brand">Card B</Text>
        <Text as="h2" variant="heading-medium" weight="semibold">New card</Text>
        <Text as="p" variant="body-medium">This is the new card. You see it only when GrowthBook serves the value &quot;new&quot; to your user_id.</Text>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <Text as="span" variant="body-small" className="text-surface-gray-muted sm:w-56 sm:shrink-0">{label}</Text>
      <Text as="span" variant="body-small" className="break-all" data-testid={`gb-${label}`}>{value}</Text>
    </div>
  );
}

function Experiment({ userUuid }: { userUuid: string }) {
  const { value, ready } = useExperimentValue<string>(TEST_CARD_FLAG, "old");
  const [seenByGrowthBook, setSeenByGrowthBook] = useState<string>("(waiting)");
  const [active, setActive] = useState<boolean | null>(null);
  const [source, setSource] = useState<string>("-");

  useEffect(() => {
    if (!ready) return;
    const client = getExperiments();
    setActive(client !== null);
    void client?.ready.then((r) => setSource(r.source));
    setSeenByGrowthBook(client ? String(client.gb.getAttributes().user_id ?? "(not set)") : "(experiments are off)");
  }, [ready]);

  const showNew = ready && value === "new";

  return (
    <div className="flex flex-col gap-6">
      {/* Space is kept while the answer is unknown, and nothing is shown until it is (no old-then-new flicker). */}
      {!ready ? (
        <div style={{ visibility: "hidden" }} aria-hidden>
          <OldCard />
        </div>
      ) : showNew ? (
        <NewCard />
      ) : (
        <OldCard />
      )}

      <Card bgcolor="white" border="border-gray-200" padding="16px" borderRadius={12} className="!h-auto">
        <div className="flex flex-col gap-2">
          <Text as="h3" variant="body-medium" weight="semibold">Debug (what GrowthBook sees)</Text>
          <Row label="flag" value={TEST_CARD_FLAG} />
          <Row label="user.uuid (app)" value={userUuid} />
          <Row label="user_id (GrowthBook)" value={seenByGrowthBook} />
          <Row label="status" value={!ready ? "waiting for GrowthBook (max 0.5 s)" : active === false ? "experiments OFF: no key, or not a production host (add localStorage cc-analytics-local=1 locally)" : "experiments ON"} />
          <Row label="source" value={source === "server-payload" ? "server payload (decided without a browser request)" : source} />
          <Row label="value served" value={ready ? value : "-"} />
          <Row label="card shown" value={!ready ? "-" : showNew ? "New card" : "Old card"} />
        </div>
      </Card>
    </div>
  );
}

export default function GrowthbookTest() {
  const { user, loading } = useAuth();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <Text as="h1" variant="heading-large" weight="semibold">GrowthBook test</Text>
      {/* AuthProvider first renders the localStorage user (up to 5 min old) and confirms it with the server 2-4 s later. If that
          cached user is not the logged-in one (e.g. another login on this browser without logout), the card is wrong until the
          confirmation arrives; the `key` below then re-evaluates it. */}
      {loading ? (
        <Text as="p" variant="body-medium">Loading…</Text>
      ) : !user ? (
        <Text as="p" variant="body-medium">Log in first: the card depends on your user_id.</Text>
      ) : (
        // key = uuid: when the server-confirmed user differs from the cached one, the answer is computed again for the right user.
        <Experiment key={user.uuid} userUuid={user.uuid} />
      )}
    </main>
  );
}
