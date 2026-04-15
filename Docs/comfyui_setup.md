# Setup ComfyUI — Boss Rush (AMD RX 6800 XT, 16 Go VRAM)

> Journal d'installation et configuration. Machine : Windows 10, AMD RX 6800 XT (RDNA2), Python 3.13.

---

## 1. Installation de base

### ComfyUI classique (C:\Users\Ben\ComfyUI) — SUPPRIME
- Premier test d'installation, abandonne : torch-directml incompatible SDXL, Python 3.13 cassait tout
- Dossier entier supprime le 2026-04-16 (cleanup) — ComfyUI-ZLUDA est la seule install active

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

### Lancement one-click
Double-cliquer `C:\Users\Ben\ComfyUI-Zluda\launch.bat`

### Commande manuelle (dans CMD, pas PowerShell)
```cmd
cd C:\Users\Ben\ComfyUI-Zluda
set HIP_VISIBLE_DEVICES=0
set HSA_OVERRIDE_GFX_VERSION=10.3.0
set CUDA_MODULE_LOADING=LAZY
set TORCH_BACKENDS_CUDNN_ENABLED=0
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
  5. Patcher `comfy/ops.py` : remplacer `SDPA_BACKEND_PRIORITY` par `[SDPBackend.MATH]` uniquement
  6. Variable env `TORCH_BACKENDS_CUDNN_ENABLED=0`

### Plugins supprimés (incompatibles RDNA2)
- `custom_nodes/ovum-cudnn-wrapper/` — réactivait cuDNN
- `custom_nodes/__pycache__/cfz_cudnn.toggle.cpython-313.pyc` — cache du toggle cuDNN

### Premier lancement
- Compilation ZLUDA = 10-15 min la première fois (une seule fois)
- Ensuite ~30-60 sec par image SDXL

---

## 3. Checkpoints installes

| Modele | Fichier | Base | Usage |
|---|---|---|---|
| **Tulpainterly XL Masterworks** | `tulpainterlyXL_masterworks.safetensors` (6.5 Go) | Illustrious XL | Premier test — a un bias anime/cel-shaded trop fort, difficile a faire du vrai gouache avec |
| **Painter's Checkpoint v1.1** | `painters_checkpoint_v11.safetensors` (~6 Go) | SDXL 1.0 | Checkpoint dedie oil painting, SDXL base pur (pas d'anime bias) — choix recommande pour le style gouache narratif |

### Lecons apprises sur les checkpoints
- **Illustrious XL** (Tulpainterly, etc.) : mieux pour les anthro/anime mais tire toujours vers un look cel-shaded meme avec LoRA painterly a 1.0
- **SDXL 1.0 base** (Painter's Checkpoint) : meilleur pour les styles peinture traditionnelle car pas de contamination anime
- **Pour ton style gouache narratif (Frazetta/DALL-E like)** : preferer SDXL base
- **IP-Adapter** : ne peut pas forcer un modele a sortir d'un style qui est profondement dans ses biases

Sources :
- [Tulpainterly XL](https://civitai.com/models/2357432/tulpainterly-xl)
- [Painter's Checkpoint](https://civitai.com/models/240154/painters-checkpoint-oil-paint-oil-painting-art-style)

---

## 4. Workflows

Fichiers dans : `D:\projets\Boss_Rush\comfyui_workflows\`

### nawel_gouache_v1.json — Workflow LoRA stack + IP-Adapter
Pipeline :
```
CheckpointLoader → [LoRA Stack ×4] → IPAdapterUnifiedLoader → IPAdapterAdvanced → KSampler → VAEDecode → SaveImage
                                                                ^
                                                    LoadImage (guerrier_ref.png)
```

### Parametres KSampler
- **steps** : 32
- **cfg** : 6.0
- **sampler** : dpmpp_2m / karras
- **resolution** : 832 x 1216 (natif SDXL 2:3)

### IP-Adapter (style transfer depuis image de reference)
- Reference : `C:\Users\Ben\ComfyUI-Zluda\input\guerrier_ref.png` (copie de `BossRush\Assets\Art\Raw\Heros\Guerrier.png`)
- Preset : `PLUS (high strength)`
- weight : 0.75
- weight_type : `linear` (plus doux que "style transfer")
- start_at : 0.0, end_at : 0.8

### Upscale (bypass par defaut, activable)
- `UpscaleModelLoader` (4x-UltraSharp) → `ImageUpscaleWithModel` → `ImageScale` (resize 1650x2250) → `SaveImage`
- Active uniquement pour les generations finales validees (economise temps en iteration)

### Resultats actuels — pas encore satisfaisants
- **Tulpainterly XL + 4 LoRA + IP-Adapter** : style reste cel-shaded cartoon, pas gouache
- **Tulpainterly XL + IP-Adapter seul (LoRAs desactives)** : meme probleme, bias anime trop fort
- **Prochain test** : `Painter's Checkpoint v1.1` (SDXL 1.0 base pur) + IP-Adapter

---

## 5. TODO

- [x] ZLUDA fonctionne sur GPU (2026-04-15)
- [x] Creer launch.bat one-click
- [x] Telecharger 4 LoRA gouache/painterly Illustrious (Maly007, V67, Achenbach, Painterly Impasto)
- [x] Telecharger 4x-UltraSharp upscaler
- [x] Installer IP-Adapter custom node + models (CLIP-ViT-H + IPAdapter Plus SDXL)
- [x] Construire workflow avance avec LoRA stack + IP-Adapter style transfer
- [x] Cleanup ancienne install ComfyUI (~15 Go)
- [ ] Tester Painter's Checkpoint (SDXL 1.0 base) pour vrai style oil painting
- [ ] Comparer resultat final ComfyUI vs DALL-E reference
- [ ] Installer Impact Pack (face/hand detailer)
- [ ] Installer ControlNet (controle de pose)

---

## 6. LoRA installes

Dans `C:\Users\Ben\ComfyUI-Zluda\models\loras\` :

| Fichier | CivitAI ID / Version | Triggers | Usage | Publie |
|---|---|---|---|---|
| `maly007_fantasy.safetensors` (218 Mo) | 2508823 / 2820049 | `malyfantasystyle, oil painting` | Knight fantasy oil painting Frazetta-like | Mar 31 2026 |
| `v67_zfurry_oil.safetensors` (218 Mo) | 2496206 / 2806058 | `zfurry, oil style, cinematic, anthro, detailed fur` | Animaux anthropomorphes oil painting | Mar 27 2026 |
| `achenbach_oil.safetensors` (465 Mo) | 2444283 / 2748243 | `achenbach, oil painting (medium), impasto, painterly, traditional media, muted colors, earthy tones` | 19e siecle oil painting, impasto | Mar 6 2026 |
| `painterly_impasto_il.safetensors` (110 Mo) | 1763670 / 1995905 | `painterly` | Style Illustrious natif impasto | 2025 |

Tous Illustrious XL base.

### Upscaler
Dans `C:\Users\Ben\ComfyUI-Zluda\models\upscale_models\` :

| Fichier | Source | Usage |
|---|---|---|
| `4x-UltraSharp.pth` (67 Mo) | [lokCX/4x-Ultrasharp (HF)](https://huggingface.co/lokCX/4x-Ultrasharp) | Upscale 4x general |

### IP-Adapter
Dans `C:\Users\Ben\ComfyUI-Zluda\models\` :

| Fichier | Dossier | Source |
|---|---|---|
| `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` (~2.5 Go) | `clip_vision/` | [h94/IP-Adapter (HF)](https://huggingface.co/h94/IP-Adapter) |
| `ip-adapter-plus_sdxl_vit-h.safetensors` (~1 Go) | `ipadapter/` | [h94/IP-Adapter (HF)](https://huggingface.co/h94/IP-Adapter) |

Custom node : `comfyui_ipadapter_plus` (via Manager)

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
| **ZLUDA sans cuDNN** | ✅ | Patch ops.py + start_zluda.py, ~30-60 sec/image |
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
| `C:\Users\Ben\ComfyUI-Zluda\` | Install ComfyUI-ZLUDA (seule install active) |
| `C:\Users\Ben\ComfyUI-Zluda\start_zluda.py` | Script de lancement custom (desactive cuDNN) |
| `C:\Users\Ben\ComfyUI-Zluda\launch.bat` | Lancement one-click local |
| `D:\projets\Boss_Rush\launch_comfyui.bat` | Lancement one-click depuis le projet |
| `C:\Users\Ben\ComfyUI-Zluda\models\checkpoints\` | Checkpoints |
| `C:\Users\Ben\ComfyUI-Zluda\models\loras\` | LoRA |
| `C:\Users\Ben\ComfyUI-Zluda\models\upscale_models\` | Upscalers |
| `C:\Users\Ben\ComfyUI-Zluda\models\clip_vision\` | CLIP Vision (pour IP-Adapter) |
| `C:\Users\Ben\ComfyUI-Zluda\models\ipadapter\` | IP-Adapter models |
| `C:\Users\Ben\ComfyUI-Zluda\input\guerrier_ref.png` | Image de reference style (IP-Adapter) |
| `C:\Users\Ben\ComfyUI-Zluda\zluda\` | Binaires ZLUDA |
| `D:\projets\Boss_Rush\comfyui_workflows\` | Workflows JSON sauvegardes |

---

## 9. Historique

| Date | Action |
|---|---|
| 2026-04-14 | Installation ComfyUI classique, test CPU, premier test Tulpainterly XL |
| 2026-04-14 | Installation ComfyUI-ZLUDA, HIP SDK 6.4.2, variables systeme |
| 2026-04-14 | ZLUDA telecharge manuellement (Windows Defender bloquait) |
| 2026-04-14 | DLL ZLUDA patchees, nccl.dll recupere apres exclusion Defender |
| 2026-04-15 | Debug cuDNN : suppression ovum-cudnn-wrapper, creation start_zluda.py |
| 2026-04-15 | Desactivation cuDNN complete (incompatible RDNA2 via ZLUDA) |
| 2026-04-15 | **ZLUDA fonctionne !** Patch ops.py (MATH only SDP), launch.bat cree |
| 2026-04-15 | Premiere image GPU generee avec succes (~30-60 sec) |
| 2026-04-16 | Telechargement 4 LoRA gouache CivitAI (Maly007, V67, Achenbach, Painterly Impasto) |
| 2026-04-16 | Telechargement 4x-UltraSharp upscaler |
| 2026-04-16 | Workflow avance v1 : LoRA stack ×4 + upscale |
| 2026-04-16 | Resultat v1 decu : style trop "comics/digital", pas gouache |
| 2026-04-16 | Installation IP-Adapter (CLIP-ViT-H + IPAdapter Plus SDXL + custom node) |
| 2026-04-16 | Workflow v2 avec IP-Adapter style transfer depuis `guerrier_ref.png` |
| 2026-04-16 | **Constat** : Tulpainterly XL a un bias anime/cel-shaded trop fort qui domine meme avec IP-Adapter solo |
| 2026-04-16 | Cleanup install : suppression ancienne `C:\Users\Ben\ComfyUI\` (~15 Go), LoRA HF inutilises |
| 2026-04-16 | Telechargement **Painter's Checkpoint v1.1** (SDXL 1.0 base pur) pour resoudre le bias |
