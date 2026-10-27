import { useEffect, useRef, useState } from 'react';
import { DataPanel } from './components/DataPanel';
import { IngredientEditor } from './components/IngredientEditor';
import { RecipeEditor } from './components/RecipeEditor';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { Welcome } from './components/Welcome';
import { isMap, MAP, useApp, useSelection } from './state';

export function App() {
  const { data } = useApp();
  const [selectedId, select] = useSelection();
  const [panelOpen, setPanelOpen] = useState(false);
  const mapOpen = isMap(selectedId);
  const item = selectedId && !mapOpen ? data.items[selectedId] : undefined;

  // Remember the item we came from, so "Back to Pizza" can be offered after
  // jumping from a product into one of its materials.
  const [prevId, setPrevId] = useState<string | null>(null);
  const lastId = useRef(selectedId);
  useEffect(() => {
    if (lastId.current !== selectedId) setPrevId(lastId.current);
    lastId.current = selectedId;
  }, [selectedId]);
  const prev = prevId ? data.items[prevId] : undefined;
  const returnTo = prev?.kind === 'recipe' && item && prev.components.some((c) => c.itemId === item.id) ? prev : null;

  // Each screen starts at the top.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [selectedId]);

  return (
    <div className={`app ${item || mapOpen ? 'has-selection' : ''}`}>
      <Sidebar selectedId={selectedId} onSelect={select} onOpenData={() => setPanelOpen(true)} />
      <main className={`main ${mapOpen ? 'map-mode' : ''}`} ref={mainRef}>
        {mapOpen && <MapView key={selectedId} focusId={selectedId.slice(MAP.length) || null} onSelect={select} />}
        {item?.kind === 'recipe' && <RecipeEditor key={item.id} item={item} onSelect={select} returnTo={returnTo} />}
        {item?.kind === 'ingredient' && <IngredientEditor key={item.id} item={item} onSelect={select} returnTo={returnTo} />}
        {!item && !mapOpen && <Welcome onSelect={select} />}
      </main>
      <DataPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
