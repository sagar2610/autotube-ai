import { Logger, type WorkflowState } from '@autotube/shared';
import { runGraph } from './runner.js';
import { workflowNodes } from './nodes.js';

export async function runWorkflow(initial: WorkflowState): Promise<WorkflowState> {
  const logger = new Logger(initial.outDir);
  const nodes = workflowNodes(logger);
  return runGraph(
    {
      order: ['topic', 'research', 'script', 'safety', 'storyboard', 'seo', 'affiliate', 'voice', 'media', 'thumbnail', 'upload'],
      nodes,
    },
    initial,
  );
}
