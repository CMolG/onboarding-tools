import type { UnlockCriterion } from 'onboarding-tools';

export function formatCriterion(criterion: UnlockCriterion): string {
  return JSON.stringify(criterion, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");
}

export function definitionSnippet({
  id,
  title,
  criterion,
  activation = 'automatic',
  event = 'profile.completed',
}: {
  readonly id: string;
  readonly title: string;
  readonly criterion?: UnlockCriterion;
  readonly activation?: 'automatic' | 'manual';
  readonly event?: string;
}) {
  const unlocksOn = criterion ? `\n  unlocksOn: ${indent(formatCriterion(criterion), 2)},` : '';
  return `const ${id}Definition: UnlockableDefinition = {
  id: '${id}',
  activation: '${activation}',
  meta: {
    title: '${title}',
    description: 'Revealed when the criterion is met.',
  },${unlocksOn}
  flow: {
    stage: '${title}',
    order: 10,
    completionEvent: '${event}',
  },
};`;
}

function indent(value: string, spaces: number) {
  const padding = ' '.repeat(spaces);
  return value.split('\n').map((line, index) => (index === 0 ? line : `${padding}${line}`)).join('\n');
}
