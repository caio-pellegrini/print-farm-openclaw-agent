# Limitações e falhas

## Confirmadas por leitura

- Stage 1 now runs a pinned OpenClaw 2.0 runtime and proves one real tool call plus application persistence. See [the Stage 1 report](stage-1-openclaw-runtime-report.md). The project still lacks a customer upload channel and verified role authorization.
- O JSON de PLA tem poucos overrides e não é um perfil de máquina completo. `inherits: fdmprinter` deixa definições, extrusor e settings implícitos. O comando original corta, mas o extrusor genérico usa 2,85 mm; converter seu comprimento como se fosse 1,75 resulta em massa errada.
- O perfil de exemplo só especifica PLA; não há preset real Ender 3 V3 SE neste ambiente.
- Usar comprimento arredondado em metros pode distorcer peças pequenas. O fallback parseia extrusão G-code, mas precisa considerar `M82/M83`, resets `G92`, retract/de-retract e movimentos de ferramenta; não foi verificado contra metadata do slicer.
- Preço e peso dependem de densidade, diâmetro/filamento e parâmetros; energia, desgaste e margem são aproximações configuráveis, não custo contábil.
- Multiplayer em OpenClaw é colaboração, não isolamento. Não guardar dados de clientes distintos no mesmo Gateway sem ACLs deliberadas.
- OctoPrint com `curl -k` desativa validação TLS; não usar em produção. A chave API deve ficar fora do prompt e ser fornecida pelo operador em segredo protegido.
- Slicing de STL não garante malha fabricável, orientação ótima, estabilidade de suportes ou qualidade. Tempo estimado não é prazo garantido.
- The historical Cura 5.0.0 CLI did not accept `--version`; Cura 5.13.0 identifies itself with `CuraEngine help` / its startup banner.

## A validar com testes

- O build e a chamada `slice` foram validados; ainda não há pin de digest da base nem versões exatas de todos os pacotes APT.
- Exact profile parity between the project's simplified CLI settings map and Cura GUI's complete resolved settings; the GUI/CLI print-time comparison is close, but the filament-volume values differ.
- Orientação/dimensões, manifoldness e volume calculados para amostras.
- Bambu Studio/Creality Print ainda não foram executados; o CLI documentado para Linux/headless precisa de validação real antes de virar adaptador.
- Exact Orca profile resolution and farm-specific profile provenance beyond the single tested CLI profile; image digests and complete OS package versions are not yet pinned.
- Moonraker/OctoPrint auth, estado e ações em simulador/mock ou instância local; nenhum hardware real conectado.
- Configuração/licenciamento e cliente oficial do Agent Index no projeto OpenClaw de submissão.

## Stage 1 findings (2026-09-26)

- The successful model depends on the authorized ChatGPT/Codex account catalog. The tested account rejected `gpt-5.6-sol`; `gpt-5.6-luna` worked. Another farm must verify the models available to its own account.
- OpenClaw 2.0 execution was tested using CLI-created sessions, not two authenticated people. There are no registered Gateway profiles in the test state, so application identity and role-capability authorization remain unproven. Product roles are composable; this does not require a distinct person per role.
- The STL was pre-staged into the approved job directory. No messaging channel was configured, and the Control UI browser was at its Gateway authentication screen. Control UI or messaging-channel upload, attachment storage paths, association with a farm job, and deletion/retention were not tested.
- STL processing is bounded and uses a private temporary copy, fixed analyzer path, `execFile`, 25 MiB input, 10-second runtime, and 1 MiB output limit. It still runs under the Gateway OS account; no OS sandbox or per-job container was used.
- OpenClaw's deep security audit reported zero critical findings and three warnings: reverse-proxy trust configuration (Gateway stayed loopback), an unpinned Codex plugin install record, and the local audit connection missing `operator.read` for a deep probe.
- The project plugin and skill were built locally; installation into a second clean user's environment, container persistence, Plow deployment, Cura invocation from OpenClaw, and Agent Index reporting remain unverified.

## Stage 2 findings (2026-09-27)

- The earlier Cura 5.0.0 generic Ender-3 proof is superseded as the baseline. CuraEngine 5.0.0 returned metrics with two `[ERROR]` diagnostics for missing legacy machine/extruder data.
- The cleanup run used stable Cura/CuraEngine `5.13.0`, official bundled Ultimaker 2+ machine/extruder definitions, generic PLA, and the bundled Normal process profile. It returned 2,035 seconds and 2,968 mm³, exited 0, and had no `[error]` diagnostics. The agent derived 3.68 g from the official material density of 1.24 g/cm³.
- The same real OpenClaw `analyze_stl` → `slice_stl` → quote flow succeeded with zero tool failures. SQLite persisted the result; a distinct OpenClaw session retrieved it. Cura time is now cross-checked against the GUI within 1.2%; material-volume parity remains unresolved.
- The saved G-code's first `;TIME:6666` is placeholder metadata, not the computed estimate. The final layer reports `;TIME_ELAPSED:2035.302919`; CuraEngine verbose output reports 2,035 s. Cura GUI reported 2,011 s for the same fixture and official Ultimaker 2+ / Generic PLA / 0.4 mm / 0.1 mm setup. Replaying Cura's complete resolved settings through CuraEngine CLI reproduced 2,011 s. Use the post-slice verbose `Print time (s)` metric as the normalized time source for the tested profile, with final `;TIME_ELAPSED` as a cross-check; ignore the initial `;TIME:6666`.
- CuraEngine emitted 130 warnings, all `JSON setting '<name>' has no [default_]value!` (122 distinct names). Some names concern motion, speeds, acceleration, cooling, and retraction, so the warning class alone cannot certify all settings. The GUI-equivalent CLI replay had the same 130 warnings, zero errors, and matched the GUI time; no timing impact was observed in this fixture/profile.
- The project's simplified fixed profile map reports 2,968 mm³ of filament, while GUI logs report 2,260 mm³ and the full-settings CLI replay reports 2,296 mm³. Time is close, but exact material/profile parity is unresolved; treat this as a limitation before using material estimates or adding profiles.
- The selected Ultimaker profile is a controlled official baseline, not a representation of the farm's physical printer. No physical print was performed.
- The quote uses example business defaults (PLA R$90/kg, machine R$2/hour, 0.12 kWh/hour, R$0.95/kWh, 40% gross margin, zero setup); these must be configured before real customer offers. Multi-copy estimates scale linearly and do not prove plate packing.
- Container limits and private input handling remain as documented in the [Stage 2 report](stage-2-openclaw-cura-report.md). The trusted host Docker daemon is still not an OS sandbox for the Gateway/plugin process.
- The runtime image and extracted AppImage assets exist only under ignored `.stage1/`; a checked-in setup/build recipe and licensing review remain open deployment work.

## Stage 3 findings (2026-09-27)

- CuraEngine 5.13.0 and OrcaSlicer 2.4.2 were both executed against the same staged 20 mm box STL. The SHA-256 and machine-readable adapter outputs are recorded in [the Stage 3 proof results](../experiments/slicing/stage3-proof-results.json); the detailed evidence and comparison are in [the Stage 3 report](stage-3-multi-slicer-proof-report.md).
- The proof's normalized material basis is filament volume in mm³ for both slicers. The generic quote function receives an explicit density input (1.24 g/cm³ in this proof) and derives grams from volume. Orca's tested G-code reported `filament_density: 0` and `total filament used [g] = 0.00`, so its quote mass is not a native Orca mass metric.
- The Orca CLI rejected its bundled Ender-3 V3 SE 0.4 mm profile because it enabled relative extrusion without a layer reset. The fixed profile in `experiments/slicing/profiles/orca-ender3-v3se-0.4-cli.json` selects absolute extrusion for this CLI run. This is a disclosed compatibility adaptation and must be reviewed against a farm's real printer firmware/profile before use.
- The Cura adapter returned 2,035 s and 2,968 mm³ with 130 setting-default warnings and no errors. This remains the simplified Cura profile map; Stage 2's GUI/full-settings material-volume parity remains unresolved.
- The Orca adapter returned 1,062 s and 2,020 mm³, no warnings/errors, and a 203,885-byte G-code artifact before temporary cleanup. Different printer/process profiles mean the two estimates are not accuracy-comparable.
- The same generic quote function consumed both results without checking slicer identity. The prototype adapters are not yet exposed through OpenClaw; the existing model-facing tool still has a fixed Cura-only profile selector.
- Local Docker image sizes were 417,407,354 bytes (~398 MiB) for Cura and 1,383,518,955 bytes (~1.29 GiB) for Orca. These images were tested locally but still need complete digest/package pinning and clean-build verification.
- Bambu Studio v02.08.02.61 and Creality Print 7.2.1 were investigated from current official docs/releases only. PrusaSlicer CLI help was previously probed as Debian `2.9.2+UNKNOWN`, but no Prusa slice was completed.
- All tested slicer engines carry AGPL-3.0 project licensing; review source/notices obligations before redistribution. No physical print was performed.
