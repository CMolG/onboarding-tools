import { DocsPage } from '@/app/components/DocsPage';
import { RecipeCard } from './RecipeCard';

export default function RecipesPage() {
  return (
    <DocsPage sectionId="recipes">
      <RecipeCard />
    </DocsPage>
  );
}
