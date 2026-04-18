@echo off
title ComfyUI-ZLUDA (AMD RX 6800 XT) - Boss Rush
cd /d C:\Users\Ben\ComfyUI-Zluda
set HIP_VISIBLE_DEVICES=0
set HSA_OVERRIDE_GFX_VERSION=10.3.0
set CUDA_MODULE_LOADING=LAZY
set TORCH_BACKENDS_CUDNN_ENABLED=0
.\zluda\zluda.exe -- venv\Scripts\python.exe start_zluda.py
pause
