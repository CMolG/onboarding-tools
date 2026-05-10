import { DocsPage } from '@/app/components/DocsPage';
import { StateMachineVisualizer } from './Viz';

export default function StateMachinePage() {
  return (
    <DocsPage sectionId="state-machine">
      <StateMachineVisualizer />
    </DocsPage>
  );
}
