import { useState } from 'react';
import { DataPanel } from './components/DataPanel';
import { IngredientEditor } from './components/IngredientEditor';
import { RecipeEditor } from './components/RecipeEditor';
import { Sidebar } from './components/Sidebar';
import { Welcome } from './components/Welcome';
import { useApp, useSelection } from './state';

export function App() {
  const { data } = useApp();
  const [selectedId, select] = useSelection();
  const [panelOpen, setPanelOpen] = useState(false);
  const item = selectedId ? data.items[selectedId] : undefined;

  return (
    <div className={`app ${item ? 'has-selection' : ''}`}>
      <Sidebar selectedId={selectedId} onSelect={select} onOpenData={() => setPanelOpen(true)} />
      <main className="main">
        {item?.kind === 'recipe' && <RecipeEditor key={item.id} item={item} onSelect={select} />}
        {item?.kind === 'ingredient' && <IngredientEditor key={item.id} item={item} onSelect={select} />}
        {!item && <Welcome onSelect={select} />}
      </main>
      <DataPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
