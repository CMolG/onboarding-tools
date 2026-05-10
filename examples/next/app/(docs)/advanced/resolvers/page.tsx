import { DocsPage } from '@/app/components/DocsPage';
import { MockLLMResolver } from './MockLLM';

export default function ResolversPage() {
  return (
    <DocsPage sectionId="resolvers">
      <MockLLMResolver />
    </DocsPage>
  );
}
