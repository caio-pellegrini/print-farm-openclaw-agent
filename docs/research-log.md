# Diário de pesquisa

## 2026-09-26 — Stage 1 OpenClaw Runtime Proof

### Question

Can the existing STL analyzer become a real OpenClaw 2.0 agent capability without exposing unrestricted repository shell access?

### Method

Installed `openclaw@2026.8.1` into an isolated npm prefix, used the official device-code OAuth flow with the user's approval, created a workspace skill and local TypeScript tool plugin, and ran agent turns through the Gateway. Used the existing 20 × 20 × 12 mm fixture. The test config was loopback-only, stored below `.stage1/state`, and restricted to two project tools.

### Results

- The real OpenClaw 2.0 Gateway reached `ready` on `127.0.0.1:18789` and loaded the project plugin and skill.
- The account rejected the initially configured `openai/gpt-5.6-sol`. Changing to the account-listed `openai/gpt-5.6-luna` fixed inference; no API key was required.
- Prompt `Analyze this STL and tell me its dimensions in millimeters. The file is small-box-20mm.stl in the approved jobs folder.` produced the tool call `analyze_stl(filename="small-box-20mm.stl")`. The tool returned a structured result with `dimensions_mm={x:20,y:20,z:12}`, 12 triangles, 4.8 cm³, one connected component, and watertight heuristic true. The assistant reported 20 × 20 × 12 mm.
- A second, distinct session invoked `get_latest_stl_analysis` and retrieved the saved result from project SQLite. A per-session marker placed in one conversation was unknown in another.
- A `../small-box-20mm.stl` tool argument returned `Pass a filename only; directory paths are not accepted.` A missing file returned `The file or configured analyzer was not found.`
- `openclaw users list --json` returned no Gateway profiles. CLI sessions share one observation identity and do not prove multiple human identities or role permissions.
- User-facing upload was not tested: the fixture was staged in the jobs directory before the prompt. OpenClaw 2.0 channel upload-to-job handling remains open.
- An isolated OpenClaw `2026.9.6` install confirmed the account's live Codex model list, but the actual end-to-end proof was then repeated and passed on the required `2026.8.1` runtime.

### Conclusion

The core architecture is viable: OpenClaw 2.0 Gateway -> skill instructions -> restricted plugin tool -> existing Python analyzer -> structured response. Application persistence also works across new sessions. The Stage 1 result is **PARTIALLY PASSED** because authenticated multi-user roles and actual customer file upload are not yet proven.

### Next step

Connect the existing Cura POC through one similarly bounded `slice_stl` tool using pre-staged files, while specifying the attachment-to-job adapter and verified user identity/authorization needed before customer intake.

## 26/09 — auditoria do projeto e regras

### Hipótese
O projeto anterior já conteria uma integração testável de slicing e as regras estratégicas herdadas continuam corretas.

### Teste
Leitura de README, Dockerfile, skill, perfil JSON e configuração; busca de arquivos no workspace; consulta às páginas oficiais Luma, AI Worth Using e OpenClaw.

### Resultado
O checkout contém configuração Hermes + skill, sem código de app/POC, amostras STL ou banco de pedidos. O Dockerfile instala `cura-engine` via APT e extrai definições Cura de pacote Debian. `agent.env` foi deliberadamente excluído de leitura. Depois do build, executei o comando original do skill com `-v`: CuraEngine 5.0.0 produziu G-code e reportou 995 s/3044 mm³, mas usou diâmetro efetivo 2,85 mm (0,477 m), embora o pedido e o JSON declarassem PLA de 1,75 mm. O comando corrigido com definição Ender-3 antiga + override explícito 1,75 mm reportou 1,26566 m para o mesmo volume.

### Conclusão
O material é um esqueleto útil, não evidência do pipeline completo. Cura funciona, mas o comando original usa default incorreto de diâmetro e pode subcotizar material. Regras oficiais exigem OpenClaw 2.0, multiplayer, MIT, client de uso e vídeo >=60 s. A página atual do Index mostra score e definições explícitas de usuário válido; screenshots históricos não são base segura para estratégia.

### Próximo passo
Construir o container e testar Cura; criar dados sintéticos locais, ferramenta de análise STL, orçamento, mock de farm e documentação de integração.

## 18:24 — CuraEngine, STL, orçamento e farm mock

### Hipótese

CuraEngine do Dockerfile anterior consegue executar headless e fornecer dados úteis ao pipeline; análise geométrica e quote local podem fechar um fluxo CLI com pouca dependência.

### Teste

Build local da imagem `plura3d-cura-poc` (Debian Trixie, CuraEngine 5.0.0); definição legacy Creality Ender-3 e perfil PLA; quatro STL sintéticos; analyzer Python standard library; quote-engine; recomendação estática de farm; script `experiments/e2e.py`.

### Resultado

4/4 slices terminaram (0.87–0.97 s por invocação Docker) e produziram G-code de 185 kB–1.63 MB. Métricas entre 995 s/3.77 g (caixa pequena) e 13.926 s/66.55 g (cilindro). O complexo sobreposto foi marcado não-manifold, apesar de Cura produzir G-code. Analyzer mediu caixa 4.8 cm³, cilindro 112.7746 cm³, contou dois componentes na amostra de dois blocos e recusou volume do complexo. E2E para quatro unidades calculou R$ 6.16 e recomendou Ender-2 da farm mock, com 1.11 h sequencial.

### Conclusão

O CLI do Cura fecha em menos de um segundo por invocação e é suficiente para um orçamento demonstrável com perfil aprovado; o cálculo não está validado em impressora física. O skill anterior carregou diâmetro efetivo 2.85 mm: no mesmo volume, filamento informado foi 0.477202 m. Aplicar `-e0 -s material_diameter=1.75` elevou a 1.26566 m. O header do G-code gravado manteve placeholder `TIME:6666`/`0m`; o bloco verbose do console continha estimativa válida neste experimento.

### Próximo passo

Comparar ao menos uma engine alternativa, validar onboarding por presets oficiais, checar compatibilidade legal/runtime e traduzir apenas o núcleo seguro para OpenClaw.

## 18:24 — verificação documental PrusaSlicer

### Hipótese

Uma segunda engine Linux pode ser instalada e fatiar headless com defaults em poucos comandos.

### Teste

Consultei release/install/CLI oficiais da Prusa. Em container Debian Trixie instalei `prusa-slicer 2.9.2+UNKNOWN`; CLI help expôs `--export-gcode` e presets separados. A consulta de presets com `--datadir` vazio falhou com “Configuration wasn't found”. Reinstalação temporária iniciou centenas de dependências GUI; interrompi esse caminho sem concluir um slice nem deixar o container ativo.

### Resultado

Prusa CLI existe, mas o pacote testado é do Debian e não é um binário Linux oficialmente validado pelo fabricante; a documentação atual da Prusa aponta Flatpak/Drivers. Nenhuma estimativa Prusa foi produzida, logo não há delta numérico contra Cura.

### Conclusão

Prusa é uma alternativa plausível de stack, mas perfil/configuração headless precisa investigação futura. Orca não foi instalada. Nenhuma impressora física/API foi conectada.

### Próximo passo

Usar os 2 dias antes da submissão em OpenClaw 2.0 multiplayer, permissões por papel, publicação, client de telemetria e vídeo; não gastar essa janela aprofundando comparativo de slicer.

## 19:00 — novo projeto OpenClaw independente e reprodução

### Hipótese

A pesquisa e as provas de conceito podem ficar num projeto OpenClaw próprio sem deixar alterações no agente Hermes anterior.

### Teste

Restaurei os arquivos rastreados modificados no checkout Hermes e confirmei `git status --short` vazio. Criei `print-farm-openclaw-agent/`, com Dockerfile Cura, perfil de exemplo autocontido, README, docs e experimentos. Gerei fixtures novamente; construí a imagem `print-farm-cura-poc` a partir da nova raiz; executei 4 slices e E2E para 4 unidades.

### Resultado

O build independente terminou. Os quatro slices saíram com exit code 0; wall 0.861–0.950s; os resultados JSON estão em `experiments/slicing/cura-results.json`. E2E reportou 20×20×12mm, 4.8cm³, 995s, 3.77g estimados, R$6.16 para quatro cópias e Ender-2 (mock). O novo projeto não contém runtime OpenClaw nem integração real com impressora.

Imagem Cura: 206,854,056 bytes (aprox. 207 MB). Uma tentativa de detectar a versão com `CuraEngine --version` falhou porque esta CLI não aceita a flag; o banner `Cura_SteamEngine version 5.0.0` identifica a versão.

### Conclusão

As POCs estão isoladas e reproduzíveis no projeto novo; checkout Hermes intacto. A conclusão sobre OpenClaw multiplayer continua documental, não uma prova de execução.

### Próximo passo

Validar OpenClaw 2.0 real, ferramenta restrita e multiplayer, além do caminho Agent Index/Plow antes de alegar prontidão para submissão.

## 2026-09-27 — Stage 2 OpenClaw + Cura POC

### Hypothesis

The Stage 1 plugin can call the existing CuraEngine POC and quote engine through one narrowly scoped tool, then persist the result for another OpenClaw session.

### Test

Using OpenClaw `2026.8.1` and the staged `small-box-20mm.stl`, added `slice_stl` and `get_latest_production_estimate` to the project plugin. The agent called `analyze_stl`, passed its matching analysis ID to `slice_stl`, ran the existing CuraEngine `5.0.0` Docker image, and called the existing Python quote function. The final successful Gateway run was `8323c4db-e14f-4345-aafe-1bf0498a5895`; it selected `analyze_stl` and `slice_stl` with no tool failures. Cura ran as the Gateway caller's numeric UID/GID inside the resource-limited container. A separate session run `6514da8d-054d-4f13-b3fd-a2d64a2d415f` called `get_latest_production_estimate` and retrieved the completed row.

### Result

Cura returned 995 seconds, 3,044 mm³, and 1.26566 m of PLA filament. The configured example density of 1.24 g/cm³ derived 3.775 g. The existing quote engine consumed that mass and 0.27639 hours with example business settings (R$90/kg material, R$2/hour machine cost, 0.12 kWh/hour, R$0.95/kWh, 40% gross margin, R$0 setup) and returned R$0.92 estimated cost, R$1.54 suggested order price, and R$0.62 estimated gross profit. SQLite estimate ID `c2d9b453-a271-4c9a-a009-0686a3505735` links analysis ID `0e671878-8e45-4d85-ab12-c49fedb675e3`; the cross-session response included filename, profile, time, material, quote, and status.

Cura exited 0 and returned metrics, but the legacy profile/image emitted 109 warnings and two `[ERROR]` diagnostics: missing `creality_base_extruder_0` and an unreadable JSON file. The data path is real, but the selected profile is not clean enough to treat as production reliable.

### Conclusion

OpenClaw can execute and persist a real Cura-based estimate and business quote through restricted project tools. Stage 2 is **partially passed** because the only tested Cura profile still emits error diagnostics and has not been validated against a physical printer.

### Next step

Repair or replace the generic Cura machine/extruder definition/profile, rerun the same live agent flow, and compare its CLI metrics against a fresh saved G-code/header or Cura UI estimate. Continue Stage 3 as slicer-output research only until that profile is clean.
