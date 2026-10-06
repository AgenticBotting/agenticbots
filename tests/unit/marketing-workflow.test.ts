import { describe, expect, it } from "vitest";
import { INITIAL_WORKFLOW_EXAMPLE, WORKFLOW_EXAMPLE, workflowExampleReducer } from "@/lib/marketing/workflow-example";

describe("illustrative BOT workflow", () => {
  it("stays unapproved when visitors jump straight to the activity record", () => {
    const record = workflowExampleReducer(INITIAL_WORKFLOW_EXAMPLE, { type: "select", step: 3, source: "manual" });
    expect(record.approved).toBe(false);
    expect(workflowExampleReducer(record, { type: "approve" }).approved).toBe(false);
    expect(WORKFLOW_EXAMPLE.demo).toBe(true);
  });

  it("retains an explicit approval when visitors review the record or an earlier step", () => {
    const review = workflowExampleReducer(INITIAL_WORKFLOW_EXAMPLE, { type: "select", step: 2, source: "manual" });
    const approved = workflowExampleReducer(review, { type: "approve" });
    const record = workflowExampleReducer(approved, { type: "select", step: 3, source: "manual" });
    expect(record).toEqual({ active: 3, approved: true, manual: true });
    expect(workflowExampleReducer(record, { type: "select", step: 0, source: "manual" }).approved).toBe(true);
  });

  it("keeps the manually chosen step until deliberate scrolling resumes", () => {
    const review = workflowExampleReducer(INITIAL_WORKFLOW_EXAMPLE, { type: "select", step: 2, source: "manual" });
    const programmaticScroll = workflowExampleReducer(review, { type: "select", step: 1, source: "scroll" });
    expect(programmaticScroll.active).toBe(2);
    const resumed = workflowExampleReducer(programmaticScroll, { type: "resume" });
    expect(workflowExampleReducer(resumed, { type: "select", step: 1, source: "scroll" }).active).toBe(1);
  });

  it("reset clears the decision as well as the selected step", () => {
    const review = workflowExampleReducer(INITIAL_WORKFLOW_EXAMPLE, { type: "select", step: 2, source: "manual" });
    const approved = workflowExampleReducer(review, { type: "approve" });
    expect(workflowExampleReducer(approved, { type: "reset" })).toEqual({ active: 0, approved: false, manual: true });
    expect(INITIAL_WORKFLOW_EXAMPLE.approved).toBe(false);
  });
});
