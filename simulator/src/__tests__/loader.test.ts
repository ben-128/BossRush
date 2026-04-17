import { describe, it, expect } from 'vitest';
import { loadDesignData, parseDesignData, DesignDataError } from '../engine/loader.js';

describe('loadDesignData', () => {
  it('loads and validates all 6 design JSONs', async () => {
    const data = await loadDesignData();
    expect(data.heroes.length).toBeGreaterThanOrEqual(5);
    expect(data.boss.length).toBeGreaterThanOrEqual(10);
    expect(data.cartesChasse.length).toBeGreaterThan(0);
    expect(data.monstres.length).toBeGreaterThan(0);
    expect(data.menaces.length).toBeGreaterThan(0);
    expect(data.destins.length).toBeGreaterThan(0);
  });

  it('every hero has at least one competence', async () => {
    const { heroes } = await loadDesignData();
    for (const h of heroes) {
      expect(h.competences.length).toBeGreaterThanOrEqual(1);
      expect(h.vie).toBeGreaterThan(0);
    }
  });

  it('every boss has a non-empty sequence, passif and actif', async () => {
    const { boss } = await loadDesignData();
    for (const b of boss) {
      expect(b.stats.sequence.length).toBeGreaterThanOrEqual(1);
      expect(b.stats.passif.length).toBeGreaterThan(0);
      expect(b.stats.actif.length).toBeGreaterThan(0);
      expect(b.vie_multiplicateur).toBeGreaterThan(0);
    }
  });

  it('every Chasse card has a prerequis and a quantite', async () => {
    const { cartesChasse } = await loadDesignData();
    for (const c of cartesChasse) {
      expect(c.prerequis.length).toBeGreaterThan(0);
      expect(c.quantite).toBeGreaterThan(0);
      expect(['action', 'objet']).toContain(c.categorie);
    }
  });

  it('card ids are unique within each pile', async () => {
    const data = await loadDesignData();
    const expectUnique = (ids: readonly string[], label: string) => {
      const set = new Set(ids);
      if (set.size !== ids.length) {
        throw new Error(`Duplicate ids in ${label}`);
      }
    };
    expectUnique(data.heroes.map((x) => x.id), 'heroes');
    expectUnique(data.boss.map((x) => x.id), 'boss');
    expectUnique(data.cartesChasse.map((x) => x.id), 'cartesChasse');
    expectUnique(data.monstres.map((x) => x.id), 'monstres');
    expectUnique(data.menaces.map((x) => x.id), 'menaces');
    expectUnique(data.destins.map((x) => x.id), 'destins');
  });
});

describe('parseDesignData', () => {
  it('raises DesignDataError with path info on invalid data', () => {
    const bad = {
      heroes: { meta: {}, heroes: [{ id: 'X', nom: 'X' }] }, // missing required fields
      boss: { meta: {}, boss: [] }, // empty array violates min(1)
      cartesChasse: { meta: {}, cartes_arsenal: [] },
      monstres: { meta: {}, monstres: [] },
      menaces: { meta: {}, epreuves: [] },
      destins: { meta: {}, destins: [] },
    };
    expect(() => parseDesignData(bad)).toThrow(DesignDataError);
  });
});
