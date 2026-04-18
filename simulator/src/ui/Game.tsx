import { useStore, totalWoundsOf } from './store.js';
import { BossCard } from './components/BossCard.js';
import { HeroPanel } from './components/HeroPanel.js';
import { Log } from './components/Log.js';
import { Controls } from './components/Controls.js';
import { PlaybackTicker } from './components/PlaybackTicker.js';

export function Game() {
  const state = useStore((s) => s.state)!;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_440px] gap-6 p-6 h-[calc(100vh-3rem)]">
        <div className="flex flex-col space-y-6 overflow-auto pr-1">
          <BossCard />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:grid-cols-3">
            {state.heroes.map((h, seat) => (
              <HeroPanel key={seat} seat={seat} />
            ))}
          </div>
          <Controls />
        </div>
        <Log />
      </div>
      <PlaybackTicker />
    </>
  );
}

export { totalWoundsOf };
