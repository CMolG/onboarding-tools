import { DocsPage } from '@/app/components/DocsPage';
import { ApiTable } from './ApiTable';

export default function ApiPage() {
  return (
    <DocsPage sectionId="api-reference">
      <ApiTable />
    </DocsPage>
  );
}
