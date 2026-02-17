import type { WorkflowState } from '@autotube/shared';

export type NodeHandler = (state: WorkflowState) => Promise<WorkflowState>;

export interface GraphSpec {
  order: string[];
  nodes: Record<string, NodeHandler>;
}

export async function runGraph(spec: GraphSpec, initial: WorkflowState): Promise<WorkflowState> {
  let state = initial;
  for (const nodeId of spec.order) {
    const node = spec.nodes[nodeId];
    if (!node) throw new Error(`Missing node ${nodeId}`);
    state = await node(state);
  }
  return state;
}
