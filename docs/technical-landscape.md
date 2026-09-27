# Panorama técnico

Pesquisa em 26/09/2026. Fontes primárias vinculadas abaixo. Resultados práticos em [slicer-comparison.md](slicer-comparison.md). Testes ocorreram em Linux x86_64 com Docker; não houve impressão física.

| Engine | Linux/CLI/formatos | Perfil, outputs e sinais para POC | Licença / distribuição | Veredito provisório |
|---|---|---|---|---|
| CuraEngine | ✅ Debian Trixie x86_64, Docker, CLI; 4 STL→G-code; ~0.9 s/invocação. | `-j` carrega definições/settings, `-l` STL, `-o` G-code; verbose console dá segundos e volume de extrusão. Máquina testada é definição antiga Ender-3, não V3 SE. | Repositório UltiMaker CuraEngine sob AGPL-3.0-or-later; pacote Debian instala rápido, porém inclui avisos de definições incompletas. Avaliar distribuição/compliance da imagem. | Melhor POC até agora: resultado executável e reprodutível offline após build. Preset genérico não é produção. |
| PrusaSlicer | 🟡 Debian CLI 2.9.2+UNKNOWN; ajuda confirma export G-code e opções de presets; sem slice. | Exige configuração/printer/print/filament presets no datadir; consulta de preset vazia falhou. Instalação Debian puxou centenas de dependências; build Linux oficial recomenda fluxo distinto (Flatpak/Drivers). | AGPL-3.0; analisar bundle/binário e licenças ao distribuir. | Candidato futuro; falta validar slice equivalente e origem estável de binário. |
| OrcaSlicer | 🔴 Não instalado/testado. Projeto mantém CLI, formatos/perfis e releases Linux, porém compatibilidade headless/distro depende da versão. | CLI e profiles parecem cobrir uso servidor; nenhuma execução real. | AGPL-3.0; bundle pode carregar dependências grandes. | Não escolher no prazo atual sem teste real. |
| Slic3r / SuperSlicer | CLI Linux; STL/AMF/OBJ/3MF conforme fork | Perl/C++ legado (Slic3r) e variantes; perfis mais manuais. | GPL/AGPL conforme projeto/fork e release. | Reserva; menos atraente para demo com pouco tempo.
| lib3mf / trimesh | Biblioteca, não slicer | Leitura/inspeção de malha; trimesh calcula bounds, volume, watertight e exporta formatos. | Ver projeto individual (lib3mf BSD-2-Clause; trimesh MIT). | Adequado à pré-validação; não estima impressão/custo sem parâmetros do fatiador.

## Fontes oficiais

- [UltiMaker CuraEngine / repositório](https://github.com/Ultimaker/CuraEngine) e [README/CLI](https://github.com/Ultimaker/CuraEngine/blob/main/README.md).
- [PrusaSlicer / repositório](https://github.com/prusa3d/PrusaSlicer), [CLI](https://help.prusa3d.com/article/command-line-interface_177484) e [exportar presets](https://help.prusa3d.com/article/exporting-and-importing-presets_2004).
- [OrcaSlicer / repositório](https://github.com/OrcaSlicer/OrcaSlicer), [wiki CLI](https://github.com/OrcaSlicer/OrcaSlicer/wiki/Command-line-arguments).
- [Slic3r / repositório](https://github.com/slic3r/Slic3r).
- [trimesh](https://trimesh.org/) / [lib3mf](https://github.com/3MFConsortium/lib3mf).

## Resultado da rodada e itens pendentes

- CuraEngine rodou headless em container local; imagem baseada em Debian Trixie instala `cura-engine` e extrai definições de pacote Cura. Não fixamos digest de base nem versões APT: build não é hermético.
- Não existe comparação numérica Cura x Prusa x Orca: só Cura completou o slice. Não inferir precisão relativa de tempo/massa.
- “Ender 3 V3 SE + PLA” não basta para perfil confiável. Exigir bundle/profile exportado e revisado ou template exato, confirmar bico, volume, material e limites; defaults genéricos devem ser rotulados.
- Velocidade/qualidade de impressão e estimativas exigem benchmark físico com máquina e firmware reais; não foi feito.
