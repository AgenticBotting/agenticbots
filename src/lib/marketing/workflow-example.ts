/** Fictional browser-only demonstration state. Never sent to a runtime or integration. */
export const WORKFLOW_EXAMPLE = { demo: true, title: "Residential service enquiry" } as const;
export type WorkflowStep = 0 | 1 | 2 | 3;
export type WorkflowExampleState = { active: WorkflowStep; approved: boolean; manual: boolean };
export type WorkflowExampleEvent =
  | { type: "select"; step: WorkflowStep; source: "manual" | "scroll" }
  | { type: "approve" }
  | { type: "resume" }
  | { type: "reset" };
export const INITIAL_WORKFLOW_EXAMPLE: WorkflowExampleState = { active: 0, approved: false, manual: false };

export function workflowExampleReducer(state: WorkflowExampleState, event: WorkflowExampleEvent): WorkflowExampleState {
  switch (event.type) {
    case "select":
      if (event.source === "scroll" && state.manual) return state;
      if (state.active === event.step && event.source === "scroll") return state;
      return { ...state, active: event.step, manual: event.source === "manual" };
    case "approve": return state.active === 2 ? { ...state, approved: true, manual: true } : state;
    case "resume": return state.manual ? { ...state, manual: false } : state;
    case "reset": return { ...INITIAL_WORKFLOW_EXAMPLE, manual: true };
  }
}
