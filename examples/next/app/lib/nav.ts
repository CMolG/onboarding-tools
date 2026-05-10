import { definitions } from '@/app/definitions';

export type SectionCategory = 'Getting started' | 'Concepts' | 'Advanced' | 'Deploy';

export interface DocsSection {
  readonly id: string;
  readonly title: string;
  readonly category: SectionCategory;
  readonly route: string;
  readonly description: string;
  readonly completionEvent?: string;
  readonly anchors: readonly string[];
  readonly related: readonly string[];
  readonly unlockHint: string;
}

export const sections = [
  {
    id: 'welcome',
    title: 'Welcome',
    category: 'Getting started',
    route: '/',
    description: 'Start the tour and watch the rail open section by section.',
    completionEvent: 'tour.started',
    anchors: ['Lifecycle map', 'Start'],
    related: ['quickstart', 'state-machine'],
    unlockHint: 'Available from a fresh visit.',
  },
  {
    id: 'quickstart',
    title: 'Quickstart',
    category: 'Getting started',
    route: '/quickstart',
    description: 'Copy the minimal provider tree and emit the first event.',
    completionEvent: 'quickstart.run',
    anchors: ['Provider tree', 'Run'],
    related: ['state-machine', 'criteria'],
    unlockHint: 'Unlocks after you start the tour from Welcome.',
  },
  {
    id: 'state-machine',
    title: 'The state machine',
    category: 'Getting started',
    route: '/concepts/state-machine',
    description: 'Cycle through HIDDEN, ELIGIBLE, UNLOCKING, and UNLOCKED.',
    completionEvent: 'state-machine.cycled',
    anchors: ['Lifecycle', 'Transitions', 'Persistence'],
    related: ['quickstart', 'criteria'],
    unlockHint: 'Unlocks after the Quickstart playground runs.',
  },
  {
    id: 'criteria',
    title: 'Criteria DSL',
    category: 'Concepts',
    route: '/concepts/criteria',
    description: 'Build event, archetype, flag, all, any, and not criteria.',
    completionEvent: 'criteria.experimented',
    anchors: ['Criterion editor', 'Combinators', 'Preview'],
    related: ['overlays', 'storage'],
    unlockHint: 'Unlocks after the state machine reaches UNLOCKED.',
  },
  {
    id: 'overlays',
    title: 'Tutorial overlays',
    category: 'Concepts',
    route: '/concepts/overlays',
    description: 'Run the real tutorial engine against three sandbox targets.',
    completionEvent: 'tutorial.dismissed',
    anchors: ['Mini app', 'Spotlight', 'Completion'],
    related: ['archetypes', 'api-reference'],
    unlockHint: 'Unlocks after you test three Criteria DSL variants.',
  },
  {
    id: 'archetypes',
    title: 'Archetypes & personalization',
    category: 'Concepts',
    route: '/concepts/archetypes',
    description: 'Drive archetype criteria from the topbar dropdown.',
    completionEvent: 'archetype.experimented',
    anchors: ['Topbar signal', 'Builder', 'Storyteller'],
    related: ['theming', 'resolvers'],
    unlockHint: 'Unlocks after the mini tutorial is dismissed.',
  },
  {
    id: 'theming',
    title: 'Theming',
    category: 'Concepts',
    route: '/concepts/theming',
    description: 'Adjust CSS tokens that style the overlay and spotlight.',
    completionEvent: 'theme.tweaked',
    anchors: ['Tokens', 'Preview', 'Reset'],
    related: ['storage', 'api-reference'],
    unlockHint: 'Unlocks after two archetypes have been tried.',
  },
  {
    id: 'storage',
    title: 'Storage adapters',
    category: 'Advanced',
    route: '/advanced/storage',
    description: 'Swap storage adapters inside an isolated playground.',
    completionEvent: 'storage.swapped',
    anchors: ['Adapters', 'Persistence', 'Remote mock'],
    related: ['resolvers', 'api-reference'],
    unlockHint: 'Unlocks when developer mode is enabled in the topbar.',
  },
  {
    id: 'resolvers',
    title: 'Resolvers & AI',
    category: 'Advanced',
    route: '/advanced/resolvers',
    description: 'Simulate a resolver that returns UnlockDecision objects.',
    completionEvent: 'resolver.invoked',
    anchors: ['Profile prompt', 'Decision', 'Integration'],
    related: ['storage', 'api-reference'],
    unlockHint: 'Unlocks after developer mode is enabled and overlays are complete.',
  },
  {
    id: 'api-reference',
    title: 'API reference',
    category: 'Advanced',
    route: '/api',
    description: 'Dense reference for public hooks and components.',
    anchors: ['Hooks', 'Providers', 'Testing'],
    related: ['recipes', 'deploy'],
    unlockHint: 'Unlocks after the overlay tutorial is complete.',
  },
  {
    id: 'recipes',
    title: 'Recipes',
    category: 'Deploy',
    route: '/recipes',
    description: 'Framework cards for Next.js, Vite, Remix, and no-router use.',
    anchors: ['Frameworks', 'Copy'],
    related: ['deploy', 'quickstart'],
    unlockHint: 'Available from a fresh visit.',
  },
  {
    id: 'deploy',
    title: 'Deploy',
    category: 'Deploy',
    route: '/deploy',
    description: 'Inspect the Vercel deployment shape for this example.',
    anchors: ['Vercel', 'Build graph'],
    related: ['recipes', 'quickstart'],
    unlockHint: 'Available from a fresh visit.',
  },
] satisfies readonly DocsSection[];

export const sectionById = Object.fromEntries(sections.map((section) => [section.id, section])) as Record<string, DocsSection>;

export const categories = Array.from(new Set(sections.map((section) => section.category))) as SectionCategory[];

export function getDefinition(id: string) {
  const definition = definitions.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown docs section "${id}".`);
  }
  return definition;
}

export function getPrevNext(id: string) {
  const index = sections.findIndex((section) => section.id === id);
  return {
    previous: index > 0 ? sections[index - 1] : null,
    next: index >= 0 && index < sections.length - 1 ? sections[index + 1] : null,
  };
}

export function getSectionByRoute(route: string) {
  return sections.find((section) => section.route === route);
}
