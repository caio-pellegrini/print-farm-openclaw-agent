# Slicing experiments

The Stage 2 OpenClaw baseline uses CuraEngine 5.13.0 and its locally built image `print-farm-cura-5.13.0:baseline`. The checked-in `Dockerfile.cura` and `run_cura.py` preserve an earlier Cura 5.0.0 / legacy Ender-3 experiment only; do not treat those historical G-code files as current estimates or print them on hardware.

## Stage 3 proof

The Stage 3 adapters use fixed profile IDs and a common result shape. The OpenClaw plugin remains Cura-only. To build Orca's pinned AppImage runtime and run both adapters:

```sh
docker build -f experiments/slicing/Dockerfile.orca -t print-farm-orca-2.4.2:baseline experiments/slicing
python3 experiments/slicing/run_stage3_proof.py
```

The proof runner also requires the Stage 2 Cura image `print-farm-cura-5.13.0:baseline` to already exist. It uses the checked-in `small-box-20mm.stl` fixture, stages one private copy for both adapters, and writes normalized results and generic quote outputs to `stage3-proof-results.json`.

The Orca Dockerfile pins the Ubuntu base digest and official AppImage SHA-256. Ubuntu package versions are not locked yet. The Cura 5.13.0 image build recipe also remains uncommitted; these are packaging blockers for clean-install reproducibility, not blockers to the executed Stage 3 adapter proof.

See the [Stage 3 report](../../docs/stage-3-multi-slicer-proof-report.md) and [slicer comparison](../../docs/slicer-comparison.md) for measurements, assumptions, and limitations.
