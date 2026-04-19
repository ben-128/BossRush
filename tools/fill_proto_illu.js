// Rempli le champ proto_illu_desc de toutes les cartes de tous les JSON.
// Usage : node tools/fill_proto_illu.js
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.resolve(__dirname, '../BossRush/Assets/Data/cartes');

const DESCRIPTIONS = {
  // HÉROS — toujours indiquer la culture des habits
  HERO_001: "Hyène anthropomorphe femelle en habits afars, lance un arc de flammes entre ses paumes.",
  HERO_002: "Suricate anthropomorphe en habits san, bondit en tendant la paume vers la lumière de l'aube.",
  HERO_003: "Jaguar anthropomorphe en armure mapuche, tient un bouclier solaire imposant.",
  HERO_004: "Ourse brune anthropomorphe en attush aïnou vert forêt, glisse le long d'un tronc arc sur le dos.",
  HERO_005: "Tur du Caucase anthropomorphe en cherkeska circassienne, bras levé tenant un parchemin scellé.",

  // BOSS
  BOSS_001: "Dragon des terres arides, écailles craquelées, braises entre les fissures.",
  BOSS_002: "Dragon à plusieurs têtes, corps serpentin sombre, ailes de chauve-souris déchirées.",
  BOSS_003: "Colosse mi-arbre mi-géant, bois noueux et mousse, racines noires perçant le sol.",
  BOSS_004: "Serpent de mer aux écailles bleu-noir, dos crêté d'épines coralliennes.",
  BOSS_005: "Humanoïde géant difforme, tête retournée, membres tordus, peau grise veinée de noir.",
  BOSS_006: "Pieuvre colossale rouge vif, huit tentacules aux ventouses dentées.",
  BOSS_007: "Dragon-requin volant, mâchoire verticale, ailes membraneuses, venin vert suintant.",
  BOSS_008: "Masse d'ombre et de fumée noire, visages humains affleurant à l'intérieur.",
  BOSS_009: "Mante religieuse colossale, pattes avant hérissées de dents, yeux composés.",
  BOSS_010: "Géant humanoïde à peau rouge, longs cheveux blancs, rubans liquides l'enroulant.",

  // MONSTRES
  MON_001: "Larve blanchâtre gluante sortant de la terre, mandibules rongeuses.",
  MON_002: "Nuée d'insectes et de chauves-souris noires tourbillonnant.",
  MON_003: "Champignon pulsant libérant des spores noires.",
  MON_004: "Créature basse à long crochet osseux courbe, gueule dessous.",
  MON_005: "Gueule autonome flottante, mâchoire hérissée de crocs.",
  MON_006: "Insecte noir à dard courbe suintant un venin verdâtre.",
  MON_007: "Créature rampante, mâchoire énorme traînant sur le sol.",
  MON_008: "Squelette de bête relevé, os fendus veinés de corruption noire.",
  MON_009: "Créature à carapace épaisse bombée, corruption dans les fissures.",
  MON_010: "Silhouette de bête faite d'ombre liquide, yeux rouges flottants.",
  MON_011: "Nuage de brume noire en forme de bête, yeux jaunes.",
  MON_012: "Créature fantomatique au visage partiel, glyphes sortant de la bouche.",
  MON_013: "Enchevêtrement de ronces noires avec gueule végétale au centre.",
  MON_014: "Masse gélatineuse noire visqueuse, ossements à demi-digérés.",
  MON_015: "Créature reptilienne allongée rampant au sol, écailles sombres.",
  MON_016: "Sangsue géante noire à ventouses, bouche circulaire dentée.",
  MON_017: "Masse rocheuse fissurée, corruption pulsant comme du magma noir.",
  MON_018: "Créature batracienne aux longues pattes arrière, prête à bondir.",
  MON_019: "Créature serpentine recroquevillée, queue enroulée.",

  // NAWEL (GUE) — Actions
  GUE_A01: "Nawel frappe un monstre d'un coup de bouclier.",
  GUE_A02: "Nawel épaule baissée bouscule un monstre.",
  GUE_A03: "Nawel rugit, un monstre se retourne vers lui.",
  GUE_A04: "Nawel blessé frappe d'un revers, ses cicatrices se referment.",
  GUE_A05: "Nawel genou à terre respire profondément, blessures se refermant.",
  GUE_A06: "Nawel ensanglanté décapite un monstre d'un coup brutal.",
  GUE_A07: "Nawel face à une file de monstres, aura bleue de regain.",
  GUE_A08: "Nawel bras écartés absorbe les blessures des alliés.",
  // NAWEL (GUE) — Objets
  GUE_O01: "Pierre mapuche noire polie sertie dans un bouclier.",
  GUE_O02: "Bouclier tawan renforcé d'os, glyphes mapuche bleues.",
  GUE_O03: "Fiole rituelle de sang de jaguar pendue au cou.",
  GUE_O04: "Hache cérémoniale mapuche à lame courbe.",
  GUE_O05: "Heaume orné de plumes bleues et d'os de jaguar.",
  GUE_O06: "Nawel mourant porte un dernier coup au Colosse.",

  // DARAA (MAG)
  MAG_A01: "Daraa lance un jet de flammes entre ses paumes.",
  MAG_A02: "Daraa forme une sphère de feu entre ses mains.",
  MAG_A03: "Daraa dirige un arc de feu qui saute entre plusieurs cibles.",
  MAG_A04: "Daraa bras levés, vortex de flammes tourbillonnant autour d'elle.",
  MAG_A05: "Daraa paume ouverte, un monstre s'embrase de l'intérieur.",
  MAG_A06: "Daraa souffle ses blessures en cendres vers un monstre.",
  MAG_A07: "Daraa en méditation, flammes internes visibles sous la peau.",
  MAG_A08: "Daraa chante en afar, glyphes de feu sortant de sa gorge.",
  MAG_O01: "Petit flacon de cendres rouges du Danakil scellé.",
  MAG_O02: "Braise rouge-orange flottant librement, étincelles autour.",
  MAG_O03: "Cristal brun-rouge gravé de runes de feu.",
  MAG_O04: "Cristal rouge-orange instable, fissures lumineuses.",
  MAG_O05: "Fiole de lave en fusion scellée, rougeoyante.",

  // GAO (SOI)
  SOI_A01: "Gao lance une épine, sève dorée remonte vers un allié.",
  SOI_A02: "Gao tambourine au sol, énergie dorée rayonnante.",
  SOI_A03: "Gao déplace des glyphes de blessure d'un allié vers un monstre.",
  SOI_A04: "Gao plante une épine dans un monstre, sève dorée remontant.",
  SOI_A05: "Gao en transe, aura dorée tourbillonnante.",
  SOI_A06: "Gao souffle de la lumière dorée dans la bouche d'un allié mort.",
  SOI_A07: "Gao secoue son fagot de sauge, pollen doré en nuage.",
  SOI_A08: "Gao trace un cercle rituel san avec des pierres.",
  SOI_A09: "Gao, pattes dans la terre, racines dorées remontant des cartes.",
  SOI_A10: "Gao puise la vie d'un allié pour en guérir un autre.",
  SOI_A11: "Gao redistribue une brume dorée entre les alliés.",
  SOI_A12: "Gao en transe, œil de destin flottant devant lui.",
  SOI_O01: "Fiole d'élixir vert doré, bouchon d'écorce.",
  SOI_O02: "Petit totem en bois à l'effigie d'un éland.",
  SOI_O03: "Gemme dorée translucide en pendentif.",
  SOI_O04: "Masque tribal san en bois sombre, peinture blanche rituelle.",
  SOI_O05: "Dard végétal vert à pointe courbe, sève suintante.",

  // ISONASH (ROD)
  ROD_A01: "Isonash arc tendu, pointe cristal alignée sur une cible lointaine.",
  ROD_A02: "Isonash tire à la hanche, autre flèche déjà en main.",
  ROD_A03: "Isonash tire une flèche empoisonnée verdâtre.",
  ROD_A04: "Isonash tire en continu pour couvrir un allié.",
  ROD_A05: "Isonash décoche trois flèches simultanément en éventail.",
  ROD_A06: "Isonash accroupie, sens en alerte, museau levé.",
  ROD_A07: "Isonash examine des traces au sol dans une clairière.",
  ROD_O01: "Carquois en cuir renforcé d'os, flèches à pointes cristal.",
  ROD_O02: "Flèches aux pointes cristallines gravées de runes aïnoues.",
  ROD_O03: "Amulette aïnoue en os, motifs spirales kamuy.",
  ROD_O04: "Griffe d'ours sacrée en trophée, perles et plumes.",
  ROD_O05: "Carquois magique surdimensionné, flèches régénérant.",
  ROD_O06: "Fiole de sève d'orme aïnou, liquide ambré.",

  // ASLAN (DIP)
  DIP_A01: "Aslan rugit tête levée, glyphes sonores circulaires.",
  DIP_A02: "Aslan désigne un monstre, un allié frappe en synchronisation.",
  DIP_A03: "Aslan attaque, tous les alliés en position derrière lui.",
  DIP_A04: "Aslan kinjal dégainé, glyphes de pacte reliant les alliés.",
  DIP_A05: "Aslan bras tendu donne un ordre, un allié charge.",
  DIP_A06: "Aslan sur un promontoire harangue les alliés, parchemin déployé.",
  DIP_A07: "Aslan désigne péremptoire un monstre, allié le frappe.",
  DIP_A08: "Aslan désigne deux alliés jouant simultanément.",
  DIP_A09: "Aslan impose les mains sur un allié, aura dorée.",
  DIP_A10: "Aslan négocie, un monstre se retourne contre le Colosse.",
  DIP_A11: "Aslan bondit sur le Colosse, kinjal plongeant vers son cœur.",
  DIP_A12: "Aslan désigne une file, tous les monstres attirés vers un seul héros.",
  DIP_O01: "Corne de tur ouvragée, motifs circassiens gravés.",
  DIP_O02: "Crinière dorée tressée, perles et métal circassien.",
  DIP_O03: "Petit coffre en bois sculpté, sceau circassien.",
  DIP_O04: "Parchemin scellé de cire rouge, écritures tribales.",
  DIP_O05: "Parchemin déployé, signatures en plusieurs langues.",

  // DESTINS
  DEN_001: "Rapace tournoyant au-dessus du camp, ombre guidant au sol.",
  DEN_002: "Jet d'eau claire jaillissant d'un amas de pierres.",
  DEN_003: "Silhouette d'aïeul dans les flammes, héros endormi à côté.",
  DEN_004: "Cache sous des racines, arc et carquois d'un pisteur mort.",
  DEN_005: "Feu de camp au crépuscule, héros en cercle en palabre.",
  DEN_006: "Objet tribal ancien affleurant de la terre mouillée.",
  DEN_007: "Pluie de cendres grises, héros grelottant, cartes qui échappent.",
  DEN_008: "Objet rituel cassé au sol, héros dépité.",
  DEN_009: "Crocs surgissant d'un fourré, branche qui fouette.",
  DEN_010: "Buisson qui remue, silhouette de monstre émergeant.",
  DEN_011: "Plusieurs monstres surgissant de toutes directions.",
  DEN_012: "Cris des héros en volutes noires s'enroulant autour du Colosse.",
  DEN_013: "Héros recevant une blessure marquante, cicatrice qui reste.",
  DEN_014: "Héros frappe le Colosse, son cri attire d'autres monstres.",
  DEN_015: "Un héros s'accapare un tas de cartes, un autre blessé regarde.",
  DEN_016: "Héros traverse un gué rocheux glissant, jambes ensanglantées.",
  DEN_017: "Vieux chamane soigne d'une main, prend un objet de l'autre.",
  DEN_018: "Héros seul s'avance dans un brouillard dense, dos au groupe.",
  DEN_019: "Héros exécute un rituel, ombre monstrueuse derrière lui.",
  DEN_020: "Cercle de héros échangeant des cartes, ombre derrière eux.",

  // MENACES
  EPR_001: "Ombre d'un monstre se jetant sur un héros, griffes en avant.",
  EPR_002: "Ombre d'un monstre se jetant sur un héros, griffes en avant.",
  EPR_003: "Ombre d'un monstre se jetant sur un héros, griffes en avant.",
  EPR_004: "Ombre d'un monstre se jetant sur un héros, griffes en avant.",
  EPR_005: "Coup porté par un monstre, impact sanglant.",
  EPR_006: "Coup porté par un monstre, impact sanglant.",
  EPR_007: "Coup porté par un monstre, impact sanglant.",
  EPR_008: "Coup porté par un monstre, impact sanglant.",
  EPR_009: "Nouveau monstre surgissant de l'ombre, corruption éclosant.",
  EPR_010: "Nouveau monstre surgissant de l'ombre, corruption éclosant.",
  EPR_011: "Nouveau monstre surgissant de l'ombre, corruption éclosant.",
  EPR_012: "Nouveau monstre surgissant de l'ombre, corruption éclosant.",
  EPR_013: "Œil démesuré du Colosse s'ouvrant dans l'obscurité.",
  EPR_014: "Colosse hurlant tête en arrière, sol tremblant.",
  EPR_015: "Onde de choc sombre émanant du Colosse, héros repoussés.",
  EPR_016: "Faille visible dans l'armure du Colosse, lumière rouge qui filtre.",
  EPR_017: "Sol se fissurant, lézardes qui s'étendent.",
  EPR_018: "Éclats de pierre et d'os fusant, héros se protégeant.",
  EPR_019: "Colosse gueule ouverte hurlant, ondes sonores visibles.",
  EPR_020: "Calme trompeur au centre d'une tempête qui tourne.",
  EPR_021: "Armure du Colosse qui se fissure, moment d'opportunité.",
  EPR_022: "Brume douce enveloppant le champ de bataille.",
  EPR_023: "Voix désincarnée murmurant une offre dangereuse.",
  EPR_024: "Débris projetés dans les airs par le combat.",
  EPR_025: "Vague d'énergie arcanique déferlant, glyphes brillants.",
  EPR_026: "Monstre surgissant par surprise d'une position inattendue.",
  EPR_027: "Pilier gigantesque menaçant de s'écrouler.",
  EPR_028: "Artefact vibrant d'énergie incontrôlable, fissures lumineuses.",
  EPR_029: "Piège visible, monstre embusqué prêt à surgir.",
  EPR_030: "Héros dos au mur, regard déterminé, moment dramatique.",
};

function setDescRecursive(obj, id, desc) {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (setDescRecursive(item, id, desc)) return true;
    }
    return false;
  }
  if (typeof obj !== 'object' || obj === null) return false;
  if (obj.id === id) {
    obj.proto_illu_desc = desc;
    return true;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      if (setDescRecursive(obj[key], id, desc)) return true;
    }
  }
  return false;
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
const applied = {};

for (const file of files) {
  const fullPath = path.join(DATA_DIR, file);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  let localCount = 0;
  for (const [id, desc] of Object.entries(DESCRIPTIONS)) {
    if (setDescRecursive(json, id, desc)) {
      localCount++;
      applied[id] = true;
    }
  }
  fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`OK ${file} : ${localCount} descriptions`);
}

const missing = Object.keys(DESCRIPTIONS).filter(id => !applied[id]);
if (missing.length > 0) {
  console.log('\nIDs non trouvés dans les JSONs :');
  missing.forEach(id => console.log('  - ' + id));
}
console.log(`\nTotal : ${Object.keys(applied).length} / ${Object.keys(DESCRIPTIONS).length}`);
