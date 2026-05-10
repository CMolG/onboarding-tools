import { DocsPage } from '@/app/components/DocsPage';
import { CriteriaEditor } from './Editor';

export default function CriteriaPage() {
  return (
    <DocsPage sectionId="criteria">
      <CriteriaEditor />
    </DocsPage>
  );
}
