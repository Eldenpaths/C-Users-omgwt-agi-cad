import { glyphToRouteTask } from './routerAdapter';
import type { GlyphDocument } from './schema';

/**
 * FusionBridge integrates GlyphCore with the IntelligenceRouter.
 * It converts a GlyphDocument into a route task for the multi-agent system.
 */
export class FusionBridge {
  async dispatch(doc: GlyphDocument): Promise<any> {
    // Dynamic import to avoid cyclic/SSR issues
    const { AGI_Router } = await import('@/core/router/IntelligenceRouter');
    const task = glyphToRouteTask(doc);
    return AGI_Router.routeTask(task as any);
  }
}

export default FusionBridge;

