# 3D Print Farm Employee — OpenClaw POC

Pesquisa e provas de conceito para um funcionário operacional de pequenas farms de impressão 3D, com OpenClaw como runtime-alvo. Este repositório é independente do agente Hermes anterior. O protótipo ainda não integra OpenClaw em execução nem impressora física; demonstra análise STL, CuraEngine local, orçamento e recomendação de uma farm simulada.

## Reproduzir

Requisitos testados: Linux x86_64, Docker, Python 3.11+ e rede para baixar pacotes Debian.

```sh
python3 experiments/stl-analysis/make_samples.py
docker build -f Dockerfile.cura -t print-farm-cura-poc .
python3 experiments/slicing/run_cura.py
python3 experiments/e2e.py experiments/stl-analysis/samples/small-box-20mm.stl --quantity 4
```

O último comando gera JSON com análise da malha, métricas do slicer, orçamento estimado e sugestão de impressora mock. Não envie o G-code gerado para uma impressora: o preset é uma base antiga Creality Ender-3, não um perfil aprovado de uma máquina física.

## Conteúdo

- `docs/`: regras oficiais, comparação de slicers, estratégia de perfis, integrações, desenho OpenClaw e relatório da pesquisa.
- `experiments/stl-analysis/`: analyzer e fixtures STL determinísticas.
- `experiments/slicing/`: build reproduzível do CuraEngine e resultados locais.
- `experiments/quote-engine/`: fórmula de orçamento configurável.
- `experiments/farm-manager/`: dados de impressoras simulados e recomendação simples.

Consulte [`docs/final-research-report.md`](docs/final-research-report.md) para decisão e limitações. Licença deste POC: MIT. CuraEngine e outros componentes mantêm suas próprias licenças; ver [`docs/licenses-and-distribution.md`](docs/licenses-and-distribution.md).
