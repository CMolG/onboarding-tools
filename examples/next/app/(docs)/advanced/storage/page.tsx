import { DocsPage } from '@/app/components/DocsPage';
import { StorageAdapterPicker } from './Picker';

export default function StoragePage() {
  return (
    <DocsPage sectionId="storage">
      <StorageAdapterPicker />
    </DocsPage>
  );
}
