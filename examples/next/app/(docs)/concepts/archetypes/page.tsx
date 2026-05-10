import { DocsPage } from '@/app/components/DocsPage';
import { ArchetypeShowcase } from './Showcase';

export default function ArchetypesPage() {
  return (
    <DocsPage sectionId="archetypes">
      <ArchetypeShowcase />
    </DocsPage>
  );
}
