# Setup ComfyUI — Boss Rush (AMD RX 6800 XT, 16 Go VRAM)

> Journal d'installation et configuration. Machine : Windows 10, AMD RX 6800 XT (RDNA2), Python 3.13.

---

## 1. Installation de base

### ComfyUI classique (C:\Users\Ben\ComfyUI) — ABANDONNÉ
- Clone du repo officiel : `git clone https://github.com/comfyanonymous/ComfyUI.git`
- Venv Python 3.13
- **torch-directml** : erreur `OpaqueTensorImpl` avec les modèles SDXL
- **Mode CPU fonctionne** (`python main.py --cpu`) mais très lent (~10+ min par image)
- Utilisé uniquement pour le premier test de workflow

### ComfyUI-ZLUDA (C:\Users\Ben\ComfyUI-Zluda) ← ACTIF
- Clone du fork patientx : `git clone https://github.com/patientx/ComfyUI-Zluda.git`
- Install via `install-n.bat` (HIP SDK 6.4.2 + Triton + MIOpen)
- Venv Python 3.13 (créé par install-n.bat)
- ComfyUI Manager inclus automatiquement

### HIP SDK AMD
- Installé : **HIP SDK 6.4.2**
- Variables système :
  - `HIP_PATH` = `C:\Program Files\AMD\ROCm\6.4\`
  - `HIP_PATH_64` = `C:\Program Files\AMD\ROCm\6.4\`
  - PATH inclut `C:\Program Files\AMD\ROCm\6.4\bin`

### ZLUDA — Installation manuelle
- Windows Defender bloque le zip et supprime `nccl.dll` → **exclusion nécessaire** sur `C:\Users\Ben\ComfyUI-Zluda\zluda\`
- Source zip : `https://github.com/lshqqytiger/ZLUDA/releases/download/rel.5e717459179dc272b7d7d23391f0fad66c7459cf/ZLUDA-nightly-windows-rocm6-amd64.zip`
- Extrait dans `C:\Users\Ben\ComfyUI-Zluda\zluda\`
- DLL patchées manuellement (PowerShell) :
  ```powershell
  cd C:\Users\Ben\ComfyUI-Zluda
  Copy-Item zluda\cublas.dll venv\Lib\site-packages\torch\lib\cublas64_11.dll -Force
  Copy-Item zluda\cusparse.dll venv\Lib\site-packages\torch\lib\cusparse64_11.dll -Force
  Copy-Item venv\Lib\site-packages\torch\lib\nvrtc64_112_0.dll venv\Lib\site-packages\torch\lib\nvrtc_cuda.dll -Force
  Copy-Item zluda\nvrtc.dll venv\Lib\site-packages\torch\lib\nvrtc64_112_0.dll -Force
  Copy-Item zluda\cufft.dll venv\Lib\site-packages\torch\lib\cufft64_10.dll -Force
  Copy-Item zluda\cufftw.dll venv\Lib\site-packages\torch\lib\cufftw64_10.dll -Force
  Copy-Item comfy\customzluda\zluda.py comfy\zluda.py -Force
  ```

---

## 2. Lancement (ZLUDA + AMD RX 6800 XT)

### Commande de lancement (dans CMD, pas PowerShell)
```cmd
cd C:\Users\Ben\ComfyUI-Zluda
set HIP_VISIBLE_DEVICES=0
set HSA_OVERRIDE_GFX_VERSION=10.3.0
set CUDA_MODULE_LOADING=LAZY
.\zluda\zluda.exe -- venv\Scripts\python.exe start_zluda.py
```

### Script start_zluda.py
Script custom qui désactive cuDNN avant le lancement (cuDNN incompatible RDNA2 via ZLUDA) :
- Désactive `torch.backends.cudnn`
- Désactive Flash SDP et Mem Efficient SDP (incompatibles)
- Active uniquement Math SDP (compatible)
- Passe les flags `--use-pytorch-cross-attention --disable-cuda-malloc`

### Problème cuDNN (RÉSOLU)
- **Erreur** : `cuDNN Frontend error: No execution plans support the graph` et `Unable to find a valid cuDNN algorithm to run convolution`
- **Cause** : cuDNN ne supporte pas RDNA2 via ZLUDA. Attention et convolutions échouent.
- **Solution** :
  1. Désactiver cuDNN dans `start_zluda.py` avant tout import
  2. Supprimer le plugin `ovum-cudnn-wrapper` qui réactivait cuDNN
  3. Supprimer le cache `cfz_cudnn.toggle.cpython-313.pyc`
  4. Utiliser `--use-pytorch-cross-attention` (pas quad-cross-attention)

### Plugins supprimés (incompatibles RDNA2)
- `custom_nodes/ovum-cudnn-wrapper/` — réactivait cuDNN
- `custom_nodes/__pycache__/cfz_cudnn.toggle.cpython-313.pyc` — cache du toggle cuDNN

### Premier lancement
- Compilation ZLUDA = 10-15 min la première fois (une seule fois)
- Ensuite ~30-60 sec par image SDXL

---

## 3. Modèle checkpoint

| Modèle | Fichier | Emplacement | Source |
|---|---|---|---|
| **Tulpainterly XL Masterworks** | `tulpainterlyXL_masterworks.safetensors` | `models\checkpoints\` | [CivitAI](https://civitai.com/models/2357432/tulpainterly-xl) |

Choisi pour : style gouache/peinture traditionnelle, basé sur Illustrious XL (2026).

---

## 4. Workflow de base

Pipeline : CheckpointLoader → CLIP Text Encode (pos/neg) → KSampler → VAE Decode → Save Image

### Paramètres KSampler
- **steps** : 30
- **cfg** : 7.5
- **sampler** : euler_ancestral
- **scheduler** : normal
- **résolution** : 832 x 1216 (ratio 2:3)

### Prompt positif (v2 — tags Illustrious)
```
masterpiece, best quality, absurdres, traditional media, gouache \(medium\), thick paint, palette knife, impasto, visible brushstrokes, textured canvas, matte finish,

solo, anthro jaguar male, muscular, feline, spotted fur, tawny and black fur, amber eyes, war paint on face, blue face paint, tribal markings,
steel blue heavy armor, wrought iron and bone armor, leather straps, massive round shield with blue geometric sun motifs, mapuche warrior,
heroic proportions, dynamic pose, mid-leap, airborne, charging forward, legs extended, cape flowing behind, shield thrust forward,
strong diagonal composition, full body portrait, looking at viewer with fierce determination, clenched jaw,

stormy mountain landscape background, dramatic sky, deep steel blue atmosphere, volumetric lighting, warm golden rim light from left, cool blue shadows from right, cinematic lighting, depth of field,

fantasy illustration, book cover art, 1980s fantasy art style, narrative painting, painterly, epic, dramatic
```

### Prompt négatif (v2)
```
worst quality, low quality, normal quality, lowres, bad anatomy, bad hands, extra fingers, missing fingers, deformed hands, error, text, watermark, signature, username, blurry, jpeg artifacts,
smooth digital art, airbrushed, photorealistic, 3d render, cgi, anime style, cartoon, comic book, flat colors, cel shading, vector art, clean lines, uniform texture, perfect symmetry, centered composition, static pose, stiff pose,
multiple characters, extra limbs, fused limbs, missing limbs
```

### Résultat premier test (CPU)
- L'image sort mais le style est trop "comics/cartoon", pas assez gouache
- Besoin de LoRA gouache/painterly pour pousser le style
- La pose est statique (besoin ControlNet plus tard)

---

## 5. TODO

- [ ] Confirmer que ZLUDA génère sans erreur cuDNN
- [ ] Télécharger des LoRA gouache/painterly pour améliorer le style
- [ ] Installer Impact Pack (face/hand detailer)
- [ ] Installer ControlNet (contrôle de pose)
- [ ] Tester un workflow avec LoRA empilés
- [ ] Comparer résultat ComfyUI vs DALL-E sur le même prompt Nawel
- [ ] Créer un .bat de lancement one-click

---

## 6. LoRA recommandés (à télécharger)

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

## 7. Nodes custom recommandés

| Node | Pourquoi |
|---|---|
| ComfyUI Impact Pack | Detailer (répare visages/mains auto) |
| ComfyUI ControlNet Aux | Préprocesseurs ControlNet (openpose, depth) |
| ComfyUI Essentials | Nodes utilitaires de base |
| WAS Node Suite | Manipulation d'images, textes |

---

## 8. Notes techniques — AMD RX 6800 XT (RDNA2)

### Compatibilité testée
| Méthode | Status | Notes |
|---|---|---|
| **DirectML** | ❌ | Erreur `OpaqueTensorImpl` sur SDXL |
| **ROCm natif Windows** | ❌ | RDNA3+ seulement |
| **ZLUDA + cuDNN** | ❌ | cuDNN incompatible RDNA2 |
| **ZLUDA sans cuDNN** | 🔄 En test | Désactivation cuDNN via start_zluda.py |
| **CPU** | ✅ | Fonctionne, ~10+ min par image |

### Variables d'environnement nécessaires
```
HIP_VISIBLE_DEVICES=0
HSA_OVERRIDE_GFX_VERSION=10.3.0    # gfx1030 = RX 6800 XT
CUDA_MODULE_LOADING=LAZY
```

### Fichiers importants
| Chemin | Usage |
|---|---|
| `C:\Users\Ben\ComfyUI\` | Install ComfyUI classique (CPU only) |
| `C:\Users\Ben\ComfyUI-Zluda\` | Install ComfyUI-ZLUDA (GPU AMD) |
| `C:\Users\Ben\ComfyUI-Zluda\start_zluda.py` | Script de lancement custom (désactive cuDNN) |
| `C:\Users\Ben\ComfyUI-Zluda\models\checkpoints\` | Modèles checkpoint |
| `C:\Users\Ben\ComfyUI-Zluda\models\loras\` | LoRA |
| `C:\Users\Ben\ComfyUI-Zluda\models\controlnet\` | ControlNet |
| `C:\Users\Ben\ComfyUI-Zluda\zluda\` | Binaires ZLUDA |

---

## 9. Historique

| Date | Action |
|---|---|
| 2026-04-14 | Installation ComfyUI classique, test CPU, premier test Tulpainterly XL |
| 2026-04-14 | Installation ComfyUI-ZLUDA, HIP SDK 6.4.2, variables système |
| 2026-04-14 | ZLUDA téléchargé manuellement (Windows Defender bloquait) |
| 2026-04-14 | DLL ZLUDA patchées, nccl.dll récupéré après exclusion Defender |
| 2026-04-15 | Debug cuDNN : suppression ovum-cudnn-wrapper, création start_zluda.py |
| 2026-04-15 | Désactivation cuDNN complète (incompatible RDNA2 via ZLUDA) |
