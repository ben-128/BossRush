# Plan — Simulateur Web de Raid Party

Plan de conception pour un simulateur web du jeu, à usage local, destiné à
tester les règles, visualiser des parties et équilibrer les valeurs.
**Aucun code n'est encore écrit** — ce document sert de brief pour le lancement
du projet.

---

## 1. Objectifs

1. **Jouer une partie** (2 à 5 joueurs) avec choix des héros + boss, tour par tour.
2. **Visualiser** l'état du jeu (files de monstres, mains, blessures, vie du boss).
3. **Trois modes d'exécution** :
   - Manuel pas-à-pas (seed fixe ou aléatoire).
   - Replay d'un log existant.
   - Batch auto (N parties, IA, stats agrégées).
4. **Logger chaque partie** dans un fichier JSONL rechargeable.
5. **Équilibrer** : agrégats (winrate, durée, cartes dominantes, héros/boss ratios),
   avec possibilité de rejouer à la main une partie précise si un résultat intrigue.

---

## 2. Stack technique

| Couche | Choix | Raison |
|---|---|---|
| Front | React + Vite + TypeScript | Itération rapide, écosystème |
| État | Zustand (ou Redux Toolkit) | État global partageable moteur ↔ UI |
| Moteur | TS pur, sans dépendance DOM | Testable, exécutable aussi en batch Node |
| Style | Tailwind | Prototypage UI rapide |
| Persistance | localStorage + fichiers JSONL | Pas de backend |
| Tests | Vitest | Unitaire moteur + effets cartes |
| Batch sim | Node CLI (`tsx`) réutilisant le moteur | Équilibrage hors navigateur |

**V1 : uniquement local** (`npm run dev`). Déploiement (Netlify/Pages) possible plus tard.

---

## 3. Organisation des fichiers

```
BossRush/                          # Unity (inchangé)
└── Assets/Data/cartes/*.json      # data canoniques du jeu, NON touchées

simulator/                         # tout le simu, isolé
├── data/                          # data spécifiques au simu
│   ├── effects.json               # effet_code par id de carte Chasse
│   ├── monster_effects.json       # triggers onArrive / onAttack / …
│   ├── boss_effects.json          # passifs + actifs codés
│   └── hero_capacities.json       # capacités spéciales codées
├── src/
│   ├── engine/                    # moteur pur TS
│   ├── ui/                        # React
│   ├── ai/                        # politiques
│   └── cli/                       # batch runner Node
├── public/data/                   # copie auto des JSON Unity au build
│   └── (heroes.json, boss.json, …)
├── scripts/
│   └── sync-data.mjs              # copie Assets/Data/cartes → public/data
└── logs/                          # sorties de simulation (gitignored)
```

**Règles :**
- Les JSON Unity (`BossRush/Assets/Data/cartes/`) restent la seule source de vérité
  pour les valeurs de design (vie, dégâts, textes, illustrations).
- Le script `sync-data.mjs` copie ces JSON dans `simulator/public/data/` au démarrage
  du dev server et avant un batch.
- Un `id` présent dans un JSON de design doit avoir une entrée dans `effects.json`
  (sinon warning au chargement → utile pour repérer les cartes pas encore codées).

---

## 4. Architecture du moteur

### 4.1 Chargement des données
- Fichiers sources : [heroes.json](../BossRush/Assets/Data/cartes/heroes.json),
  [boss.json](../BossRush/Assets/Data/cartes/boss.json),
  [cartes_Chasse.json](../BossRush/Assets/Data/cartes/cartes_Chasse.json),
  [monstres.json](../BossRush/Assets/Data/cartes/monstres.json),
  [Menaces.json](../BossRush/Assets/Data/cartes/Menaces.json),
  [destins.json](../BossRush/Assets/Data/cartes/destins.json).
- Schémas TS + validation **Zod** au chargement → détecte les erreurs de données tôt.

### 4.2 Modèle d'état (immutable, `GameState`)

```
GameState {
  players: Player[]        // héros, main, capacité utilisée?, blessures[]
  activePlayerIdx
  boss: Boss + { hp, damageStack, passifsActifs }
  piles: { chasse, menace, monstre, destin } (+ défausses)
  turn, phase
  rngSeed                  // critique pour reproductibilité
  history: Event[]
}
```

### 4.3 Machine à états (phases d'un tour)

```
START_TURN → ACTION_CHOICE (Piocher | Échanger | Jouer)
           → CAPACITE_SPECIALE (optionnelle, interruptible)
           → BOSS_SEQUENCE (itérer icônes de la séquence)
             ├ 🃏 → draw Menace → résoudre (Assaut ou Événement)
             ├ 🐾 → draw Monstre → fond de file
             ├ ⚔  → attaque tête de file
             └ ⚡ → actif boss
           → CHECK_END (victoire/défaite)
           → NEXT_TURN
```

Implémenter comme **réducteur** `step(state, action) → state'` : chaque transition
est un événement nommé, loggable et rejouable.

### 4.4 Système d'effets de carte — DSL dans `effects.json`

Les effets sont en texte libre dans les JSON de design. Pour les simuler, on
définit un code structuré dans un fichier à part, indexé par `id` :

```jsonc
// simulator/data/effects.json
{
  "GUE_A05": {
    "effet_code": [ { "op": "heal", "target": "self", "amount": 3 } ]
  },
  "GUE_A01": {
    "effet_code": [
      { "op": "attack", "target": "queue_head" },
      { "op": "moveMonster", "from": "target", "to": "next_hero_queue_tail" }
    ]
  },
  "GUE_A06": {
    "effet_code": [
      { "op": "require", "cond": { "selfDamage": ">=4" } },
      { "op": "eliminate", "target": { "pick": "monster_in_self_queue" } }
    ]
  }
}
```

Autres fichiers :

```jsonc
// simulator/data/hero_capacities.json
{ "HERO_001": { "capacite_code": [ { "op": "eliminate", "target": { "all": "monsters_with_damage" } } ] } }

// simulator/data/boss_effects.json
{ "BOSS_003": {
    "passif_code": [ { "op": "modifier", "when": "attack_order", "add_targets": "next_hero_queue" } ],
    "actif_code":  [ { "op": "moveAllQueueHeads", "to": "next_hero_queue_tail" } ]
} }

// simulator/data/monster_effects.json
{ "MON_XXX": {
    "triggers": {
      "onArrive":    [ /* … */ ],
      "onAttack":    [ /* … */ ],
      "onDamage":    [ /* … */ ],
      "onEliminate": [ /* … */ ]
    }
} }
```

**Vocabulaire d'ops cible (~15-20 au total) :**
`attack`, `damage`, `heal`, `draw`, `discard`, `drawDestin`, `drawMenace`,
`summon`, `eliminate`, `moveMonster`, `bossHeal`, `bossDamage`, `regenCapacite`,
`require` (condition), `choice` (événement à options), `forEach` (itération),
`modifier` (passif persistant), `revive`.

Un **exécuteur** unique interprète les opérations. Équilibrage = modifier un
nombre dans le JSON, relancer une simu.

### 4.5 IA des joueurs (pour auto-sim)

- `random` : action légale au hasard.
- `heuristic` : règles simples (attaquer si file ≥ X, soigner si blessures ≥ vie-2,
  piocher si main < 3, etc.).
- `human` : UI bloque sur chaque décision.
- `mcts` (bonus, plus tard) : Monte-Carlo léger pour benchmark « joueur optimal ».

Politique **choisie par joueur**, donc on peut tester « 1 humain + 4 bots ».

### 4.6 RNG déterministe

- Seed stockée dans l'état. Toute pioche et tout choix aléatoire passe par un
  PRNG seedé (`seedrandom` ou équivalent).
- Permet : replay exact, régression sur un seed donné, bugs reproductibles.

### 4.7 Log d'événements

Chaque mutation émet un `Event` typé :

```
{ t: 12, kind: "DAMAGE", src: "MON_003", tgt: "HERO_002", amount: 2 }
{ t: 13, kind: "ELIMINATE", who: "MON_003" }
```

Le log est **la source de vérité pour la visualisation** et pour l'analyse
d'équilibrage.

---

## 5. Logs par partie — format JSONL

Un fichier par partie, écrit en streaming (partie non perdue si crash) :

```
simulator/logs/<timestamp>_<seed>.jsonl
```

```jsonl
{"t":0,"kind":"SETUP","seed":42,"boss":"BOSS_001","heroes":["HERO_001","HERO_003"],"nPlayers":2}
{"t":1,"kind":"DRAW_HAND","player":0,"cards":["GUE_A05","MAG_A02","MAG_O01"]}
{"t":2,"kind":"TURN_START","player":0}
{"t":3,"kind":"PLAY","player":0,"card":"MAG_A02","targets":["MON_003"]}
{"t":4,"kind":"DAMAGE","src":"MAG_A02","tgt":"MON_003","amount":2}
{"t":5,"kind":"ELIMINATE","who":"MON_003"}
{"t":6,"kind":"BOSS_SEQ","icon":"menace"}
{"t":7,"kind":"DRAW_MENACE","card":"MEN_014"}
...
{"t":312,"kind":"GAME_END","result":"victory","turns":28,"deadHeroes":[]}
```

Avantages : streamable, `grep`-able, convertible en CSV, **rechargeable** dans
l'UI pour rejouer pas à pas n'importe quelle partie batch.

**Sortie d'un batch** :

```
simulator/logs/batch_2026-04-17_10k_BOSS_001/
├── summary.csv           # 1 ligne par partie (seed, durée, gagnant, …)
├── stats.json            # agrégats calculés
└── games/
    ├── 00001_seed00042.jsonl
    ├── 00002_seed00043.jsonl
    └── …
```

Option `--keepLogs=anomalies` : ne garde que les parties extrêmes (durée
aberrante, résultat surprenant) pour économiser le disque sur les gros batchs.

---

## 6. Interface utilisateur

### 6.1 Écran setup
- Nombre de joueurs (2-5).
- Par joueur : choix héros (ou aléatoire) + politique d'IA.
- Choix boss (filtrable par difficulté) ou aléatoire.
- Seed optionnelle.
- Bouton « Démarrer ».

### 6.2 Écran partie (layout)

```
┌──────────────────────────────────────────────┐
│  BOSS (nom, séquence, passif, actif, vie)    │
│  [pile blessures visible]                    │
├──────────────┬───────────────────────────────┤
│ Héros 1      │ Héros 2  │ Héros 3  │ ...    │
│ file ↓       │ file ↓   │ file ↓   │        │
│ blessures    │ ...                           │
│ main [cards] │                               │
└──────────────┴───────────────────────────────┘
│ LOG (scrollable, filtrable par type)         │
│ CONTROLS : [Étape] [Tour] [Auto x1/x10/max]  │
└──────────────────────────────────────────────┘
```

- Cartes cliquables quand le joueur humain doit choisir.
- Indicateur de phase (quelle icône de la séquence boss est en cours).
- Animations minimales pour V1 (highlight + délai configurable).

### 6.3 Contrôles d'exécution
- **Pas-à-pas** : chaque clic avance d'un event.
- **Tour par tour** : avance jusqu'à `END_TURN`.
- **Auto partie** : boucle jusqu'à victoire/défaite.
- **Vitesse auto** : slider ms entre events.
- **Bouton « Charger log »** : ouvre un fichier JSONL et rejoue.

---

## 7. Mode équilibrage

### 7.1 Batch runner (CLI)

```
npm run sim -- --runs 10000 --heroes random --boss BOSS_001 --players 3
```

Sort `summary.csv` :

```
seed, boss, heroes, nPlayers, winner, turns, boss_hp_remaining, dead_heroes, ...
```

### 7.2 Tableau de bord (onglet UI)

Alimenté par les fichiers de sortie d'un batch :
- Winrate par boss, par nombre de joueurs.
- Winrate par composition d'héros.
- Distribution de durée de partie (tours).
- Fréquence de mort par héros (qui tombe en premier ?).
- Cartes Chasse les plus jouées / jamais jouées.
- Cartes Destin / Menace les plus impactantes (corrélation avec défaite).
- Détection de combos dominantes (winrate > 95 % ou < 10 % → à ajuster).
- **Clic sur une ligne du tableau → rejouer la partie** (charge le JSONL
  correspondant dans l'écran partie).

### 7.3 Le simulateur ne modifie jamais les JSON

Le simu lit les JSON de design, il ne les écrit **jamais**. Il produit
uniquement des rapports (stats agrégées, logs JSONL, CSV). Pour tester une
valeur différente, l'utilisateur modifie lui-même le JSON Unity concerné
puis relance une simu. Une seule source de vérité (les JSON versionnés),
le simu est un outil **en lecture pure**.

---

## 8. Découpage en jalons

| Jalon | Livrable | Focus |
|---|---|---|
| **J1 — Socle** | Chargement JSON + types + validation Zod + seed PRNG + script sync-data | Fondations |
| **J2 — Moteur minimal** | Setup, tour, pioche/défausse, attaques simples, fin de partie. Zéro effet spécial. | Boucle jouable |
| **J3 — DSL effets** | Exécuteur + 10 ops de base + annotation `effects.json` sur ~30 % des cartes | Vraies parties |
| **J4 — UI pas-à-pas** | React, setup, plateau, log, contrôles | Visualisable |
| **J5 — IA heuristique + auto-sim** | Partie jouée seule de bout en bout + écriture JSONL | Batch possible |
| **J6 — Couverture cartes** | Annoter 100 % cartes Chasse / Menaces / Destins / monstres / capacités / boss | Fidélité |
| **J7 — Batch CLI + dashboard stats** | `npm run sim`, CSV + stats, bouton replay | Outil d'équilibrage |

---

## 9. Points d'attention / décisions tranchées

1. **Effets codés** → fichiers séparés dans `simulator/data/`, indexés par `id`.
   Les JSON de design Unity ne sont pas pollués.
2. **Source de vérité** → JSON Unity ; copie automatique vers `simulator/public/data/`.
3. **Modes** → manuel pas-à-pas + replay + batch auto, tous basés sur le même moteur seedé.
4. **Un log JSONL par partie**, même en batch (option pour n'en garder qu'une partie si disque saturé).
5. **Capacités monstres** : mêmes ops que les cartes, avec triggers (`onArrive`, `onAttack`, `onDamage`, `onEliminate`) — voir [règles § Types d'effets de capacité](../BossRush/Assets/Data/regles/REGLES_RESUME.md).
6. **Passifs/actifs boss** : le DSL doit supporter des modifieurs globaux persistants, pas seulement des actions ponctuelles (ex. Caicai *« ordres d'attaque sur la file suivante en plus »*).
7. **Tests** : au moins un test d'intégration par boss (setup + 20 tours random) et une suite par héros (chaque carte jouable au moins une fois).
8. **Choix IA sur événements** : pour une Menace Événement « choisir A ou B », définir une heuristique par défaut (ou random) pour les politiques non-humaines.

---

## 10. Décisions actées sur les questions ouvertes

- **Politique IA sur les choix** : paramétrable par run via `--choicePolicy=random|heuristic`. Pas de défaut imposé, à choisir selon ce qu'on teste.
- **Taille de batch CLI** : paramétrable via `--runs N`, **défaut = 100**. Override libre pour des batchs plus précis (1 000 / 10 000).
- **Export des valeurs** : aucun. Le simu ne modifie jamais les JSON. Voir § 7.3.
