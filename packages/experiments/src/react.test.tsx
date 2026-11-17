// Server-rendered markup of the experiment text (what the visitor's first paint contains). The hook effect itself runs
// in the browser and is covered by the Playwright check in docs/phases/118.
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createExperimentsHooks } from "./react";

describe("ExperimentText (server render)", () => {
  it("NOT configured (no client key): plain visible control text, exactly as before the experiment code existed", () => {
    const { ExperimentText } = createExperimentsHooks({ getClient: () => null, configured: false });
    const html = renderToString(<ExperimentText flagKey="lp_x" control="Start for free" />);
    expect(html).toContain("Start for free");
    expect(html).not.toContain("hidden");
  });

  it("configured: the text keeps its space but is hidden until the assignment is known (no control->variant flicker)", () => {
    const { ExperimentText } = createExperimentsHooks({ getClient: () => null, configured: true });
    const html = renderToString(<ExperimentText flagKey="lp_x" control="Start for free" />);
    expect(html).toContain("Start for free");
    expect(html).toContain("visibility:hidden");
    expect(html).toContain('data-exp-flag="lp_x"');
  });

  it("configured but disabled for this visitor (e.g. Hindi page): visible control, no hiding", () => {
    const { ExperimentText } = createExperimentsHooks({ getClient: () => null, configured: true });
    const html = renderToString(<ExperimentText flagKey="lp_x" control="Start for free" enabled={false} />);
    expect(html).toContain("Start for free");
    expect(html).not.toContain("hidden");
  });
});
