# Arquitetura OpenClaw sugerida

## Status atual

Esta é uma POC nova e independente destinada a OpenClaw; o agente Hermes anterior não foi alterado. Stage 1 later installed and ran OpenClaw 2.0 and validated the narrow STL-analysis integration; see [the runtime report](stage-1-openclaw-runtime-report.md) and [current OpenClaw notes](openclaw-notes.md). The architecture below remains a product-level proposal beyond that first capability proof.

```text
OpenClaw Gateway + canal de conversa (Discord/Telegram ou UI)
  ├── Skill: intake/quote (STL local, slicer, orçamento)
  ├── ferramenta local limitada: analyze/slice/quote (Python + Cura/Prusa CLI)
  ├── SQLite: jobs, eventos, status, custos e auditoria
  └── adapter opcional: OctoPrint REST, read-only na primeira versão
```

Manter slicer e ferramentas no mesmo host/rede privada da farm; OpenClaw tem que chamar comandos fixos com argumentos validados, não shell livre sobre upload de cliente. Usar diretório temporário por job, limite de tamanho/tempo, execução sem rede, apagar STL/G-code conforme política de retenção.

## Skill/tooling

- OpenClaw skill format: directory with `SKILL.md` and YAML frontmatter `name` + `description`; workspace path `skills/<skill-name>/SKILL.md`. Skills give workflow/instructions; plugins are the package for code-backed capabilities/channels/lifecycle. Register the slicer through a small host tool/limited executable rather than granting unrestricted shell. Official docs: [Skills](https://docs.openclaw.ai/tools/skills), [Creating skills](https://docs.openclaw.ai/tools/creating-skills), [Tools overview](https://docs.openclaw.ai/tools).
- Skill descreve quando pedir STL, material, quantidade, pedir confirmação, reportar origem/versionamento do perfil e explicar que tempo/preço são estimativas.
- Ferramenta local Python faz análise STL e chamada subprocess a uma engine fixada. JSON stdout validado por schema; não pedir ao modelo para estimar por conta própria dimensões ou custo.
- Ferramenta de quote usa config versionada de custos. Um operador revisa orçamento antes de enviar ao cliente.
- SQLite mantém eventos append-only (`quote_created`, `quote_approved`, `job_queued`, `printer_state_changed`, `job_completed/failed`).
- Integração inicial com impressora apenas consulta estados, exige autorização para uploads; start/cancel depois de teste e confirmação.

## Multiplayer e papéis

OpenClaw chama a capacidade de colaboração **Multi-user mode** na documentação. Clientes e usuários do negócio podem participar em sessões compartilhadas do mesmo agente com criador/owner/participantes/presença. Uma identidade de negócio pode exercer as tarefas de Proprietário e Operador; uma equipe pode dividi-las. Todo usuário autorizado a operar o agente pode potencialmente usar ferramentas e ver dados daquele trust domain; portanto, não tratar owner/avatars/filtros como ACL. MVP seguro: gateway privado da equipe e conversa pública de orçamento em workflow de pedido que não vaze sessões. Para clientes externos, canal vinculado à identidade + autorização por pedido, ou gateway/agent boundary separado.

Papéis no fluxo são capacidades do produto, não pessoas separadas (política de produto própria, ainda não provada como role OpenClaw pronta). A mesma identidade pode acumular papéis, como `OWNER + OPERATOR`; uma equipe pode distribuí-los entre pessoas. OpenClaw Multi-user mode oferece colaboração, mas não implementa essa autorização de produto.

- Cliente: envia arquivo e recebe status/orçamento do seu pedido.
- Operador: revisa qualidade, marca printer offline/manutenção, inicia trabalho mediante confirmação.
- Proprietário: consulta filas, receitas e estimativas agregadas.

## Setup local/deploy

1. Instalar OpenClaw `v2026.8.1` (a release documentada como OpenClaw 2.0) ou posterior compatível e completar onboarding; a documentação oficial recomenda Node 24.16+ ou 26.1+.
2. Instalar skill e dependências/slicer por imagem Docker declarativa, fixada por digest e architecture, com licença/compliance analisado.
3. Rodar `doctor`, detectar disponibilidade/perfis e coletar config da impressora/custos.
4. Começar em simulação/manual; adicionar adapter OctoPrint/Moonraker após conexão validada.
5. Usuários autenticam no Gateway; atribuir permissões de aplicação pelas capacidades de cada papel, permitindo papéis combinados; redigir política de sessão.
6. Adicionar AI Worth Using client (execução recorrente e registro; proteger token, sem reportar artificialmente).
7. Empacotar imagem pública/MIT e solicitar verificação/1-click pelo Agent Index.

## Distribuição e limitações

OpenClaw é instalável em Linux, mas slicers, perfis e acesso à LAN tornam essa solução mais pesada que um agente só de texto. Documentação oficial descreve Node 24.16+/26.1+ e Linux/macOS/Windows; para print farm, focar Linux x86_64 e Docker para CLI local. 1-click Plow é recomendado no guia atual, mas o organizador tem de habilitar a listagem.

Fontes: [OpenClaw install](https://docs.openclaw.ai/install), [multi-user mode](https://docs.openclaw.ai/concepts/multi-user), [Agent Index publish](https://aiworthusing.com/agent-index/publish), [Agent Index client](https://github.com/plow-pbc/agent-index-client).
