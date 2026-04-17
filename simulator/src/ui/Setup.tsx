import { useStore } from './store.js';

export function Setup() {
  const design = useStore((s) => s.design)!;
  const form = useStore((s) => s.form);
  const setBoss = useStore((s) => s.setBoss);
  const setHeroAt = useStore((s) => s.setHeroAt);
  const addHero = useStore((s) => s.addHero);
  const removeHero = useStore((s) => s.removeHero);
  const setSeed = useStore((s) => s.setSeed);
  const start = useStore((s) => s.start);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <section>
        <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-2">Boss</h2>
        <select
          value={form.boss}
          onChange={(e) => setBoss(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2"
        >
          {design.boss.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} — {b.nom} ({b.difficulte}, HP ×{b.vie_multiplicateur})
            </option>
          ))}
        </select>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm uppercase tracking-wider text-stone-400">
            Héros ({form.heroIds.length}/5)
          </h2>
          <div className="space-x-1">
            <button
              onClick={removeHero}
              disabled={form.heroIds.length <= 2}
              className="px-2 py-1 text-xs bg-stone-800 border border-stone-700 rounded disabled:opacity-40"
            >
              −
            </button>
            <button
              onClick={addHero}
              disabled={form.heroIds.length >= 5}
              className="px-2 py-1 text-xs bg-stone-800 border border-stone-700 rounded disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {form.heroIds.map((hid, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="text-xs text-stone-500 w-16">Seat {idx}</span>
              <select
                value={hid}
                onChange={(e) => setHeroAt(idx, e.target.value)}
                className="flex-1 bg-stone-800 border border-stone-700 rounded px-3 py-2"
              >
                {design.heroes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nom} — {h.titre} (PV {h.vie}, {h.competences.join('/')})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-2">Seed</h2>
        <input
          value={form.seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="nombre ou chaîne (ex : 42)"
          className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2"
        />
      </section>

      <button
        onClick={start}
        className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 rounded font-semibold"
      >
        Démarrer la partie
      </button>
    </div>
  );
}
