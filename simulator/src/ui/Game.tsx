import { useStore, totalWoundsOf } from './store.js';
import { BossCard } from './components/BossCard.js';
import { HeroPanel } from './components/HeroPanel.js';
import { Log } from './components/Log.js';
import { Controls } from './components/Controls.js';

export function Game() {
  const state = useStore((s) => s.state)!;

  return (
    <>
      <div className="grid grid-cols-[1fr_400px] gap-4 p-4 h-[calc(100vh-3rem)]">
        <div className="flex flex-col space-y-4 overflow-auto">
          <BossCard />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {state.heroes.map((h, seat) => (
              <HeroPanel key={seat} seat={seat} />
            ))}
          </div>
          <Controls />
        </div>
        <Log />
      </div>
    </>
  );
}

export { totalWoundsOf };
