# Setup ComfyUI — Boss Rush (AMD RX 6800 XT, 16 Go VRAM)

> Journal d'installation et configuration. Machine : Windows 10, AMD RX 6800 XT (RDNA2), Python 3.11 + 3.13.

---

## 1. Installation de base (fait ✅)

### ComfyUI classique (C:\Users\Ben\ComfyUI)
- Clone du repo officiel : `git clone https://github.com/comfyanonymous/ComfyUI.git`
- Venv Python 3.13 (créé, mais Python 3.13 incompatible avec torch-directml)
- **Problème torch-directml** : erreur `OpaqueTensorImpl` avec les modèles SDXL
- **Mode CPU fonctionne** (`python main.py --cpu`) mais très lent (~10+ min par image)

### ComfyUI-ZLUDA (C:\Users\Ben\ComfyUI-Zluda) ← ACTIF
- Clone du fork patientx : `git clone https://github.com/patientx/ComfyUI-Zluda.git`
- Install via `install-n.bat` (HIP SDK 6.4.2 + Triton + MIOpen)
- ZLUDA téléchargé manuellement (Windows Defender bloquait le zip)
  - Source : `https://github.com/lshqqytiger/ZLUDA/releases/download/rel.5e717459179dc272b7d7d23391f0fad66c7459cf/ZLUDA-nightly-windows-rocm6-amd64.zip`
  - Extrait dans `C:\Users\Ben\ComfyUI-Zluda\zluda\`
  - DLL patchées manuellement (cublas, cusparse, nvrtc, cufft, cufftw)
- **Lancement** : `.\zluda\zluda.exe -- venv\Scripts\python.exe main.py --auto-launch --use-quad-cross-attention`
- Ou via `comfyui-n.bat`
- ⚠️ Premier lancement = 10-15 min de compilation ZLUDA (une seule fois)
- ⚠️ Exclusion Windows Defender nécessaire sur le dossier `C:\Users\Ben\ComfyUI-Zluda\`

### HIP SDK AMD
- Installé : HIP SDK 6.4.2
- Variables système ajoutées :
  - `HIP_PATH` = `C:\Program Files\AMD\ROCm\6.4\`
  - `HIP_PATH_64` = `C:\Program Files\AMD\ROCm\6.4\`
  - PATH inclut `C:\Program Files\AMD\ROCm\6.4\bin`

---

## 2. Modèle checkpoint

| Modèle | Fichier | Emplacement |
|---|---|---|
| **Tulpainterly XL Masterworks** | `tulpainterlyXL_masterworks.safetensors` | `models\checkpoints\` |

Source : https://civitai.com/models/2357432/tulpainterly-xl
Choisi pour : style gouache/peinture traditionnelle, basé sur Illustrious XL.

---

## 3. Workflow de base (testé en CPU ✅)

Pipeline : CheckpointLoader → CLIP Text Encode (pos/neg) → KSampler → VAE Decode → Save Image

### Paramètres KSampler
- **steps** : 30
- **cfg** : 7.0
- **sampler** : euler_ancestral
- **scheduler** : normal
- **résolution** : 832 × 1216 (ratio 2:3)

### Prompt positif (template Nawel/test)
```
Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible, loose, confident, varied in direction and pressure. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork.

Anthropomorphic jaguar warrior, massive powerful feline musculature, spotted black-on-tawny fur. Deep steel blue armor, wrought iron and bone. Massive round shield with blue geometric solar motifs. Blue war paint on muzzle and cheeks. Mid-leap charge, body airborne, strong diagonal composition. Stormy mountain landscape tinted deep steel blue. Warm golden light from one side, cool blue shadows.

Portrait orientation, 2:3 aspect ratio.
```

### Prompt négatif
```
smooth, airbrushed, digital painting, photorealistic, soft focus, blurry, concept art, 3D render, CGI, anime, cartoon, comic book coloring, uniform brushstrokes, perfect rendering, photo
```

### Résultat premier test
- L'image sort mais le style est trop "comics/cartoon", pas assez gouache
- Besoin de LoRA gouache/painterly pour pousser le style
- La pose est statique (besoin ControlNet plus tard)

---

## 4. TODO — Prochaines étapes

- [ ] **Faire tourner le GPU** (ZLUDA ou portable AMD)
- [ ] Télécharger des LoRA gouache/painterly pour améliorer le style
- [ ] Installer ComfyUI Manager (custom nodes)
- [ ] Installer Impact Pack (face/hand detailer)
- [ ] Installer ControlNet (contrôle de pose)
- [ ] Tester un workflow avec LoRA empilés
- [ ] Comparer résultat ComfyUI vs DALL-E sur le même prompt Nawel

---

## 5. LoRA recommandés (à télécharger)

### Style gouache/peinture
| LoRA | Usage | Poids suggéré | Compatibilité |
|---|---|---|---|
| Gouache Style / Traditional Media | Brushstrokes visibles, texture peinture | 0.6-0.8 | SDXL / Illustrious |
| Impasto Painting | Peinture épaisse, palette knife | 0.4-0.6 | SDXL |
| Fantasy Book Cover | Style couverture livre 80-90s | 0.5-0.7 | SDXL |

### Sujets
| LoRA | Usage | Compatibilité |
|---|---|---|
| Anthro/Furry character | Animaux anthropomorphes | Pony / Illustrious |
| Fantasy Armor | Armures fantasy | SDXL |

### UI / Icônes (style clean, pas gouache)
| LoRA | Usage |
|---|---|
| Game Icon | Icônes stylisées propres |
| Flat Design Icon | Style clean pour UI |

---

## 6. Nodes custom recommandés

| Node | Pourquoi |
|---|---|
| ComfyUI Impact Pack | Detailer (répare visages/mains auto) |
| ComfyUI ControlNet Aux | Préprocesseurs ControlNet (openpose, depth) |
| ComfyUI Essentials | Nodes utilitaires de base |
| WAS Node Suite | Manipulation d'images, textes |

---

## 7. Notes techniques

### AMD RX 6800 XT (RDNA2) — Compatibilité
- **DirectML** : marche partiellement, erreur OpaqueTensorImpl sur SDXL
- **ROCm natif Windows** : RDNA3+ seulement (pas RDNA2)
- **ZLUDA** : solution recommandée pour RDNA2 sur Windows
- **CPU** : fonctionne mais ~10+ min par image SDXL

### Fichiers importants
- ComfyUI : `C:\Users\Ben\ComfyUI\`
- ComfyUI-ZLUDA : `C:\Users\Ben\ComfyUI-Zluda\`
- Checkpoints : `models\checkpoints\`
- LoRA : `models\loras\`
- ControlNet : `models\controlnet\`
