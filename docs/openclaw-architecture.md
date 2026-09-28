# Arquitetura OpenClaw sugerida

## Status atual

Esta é uma POC nova e independente destinada a OpenClaw; o agente Hermes anterior não foi alterado. Stage 1 later installed and ran OpenClaw 2.0 and validated the narrow STL-analysis integration; see [the runtime report](stage-1-openclaw-runtime-report.md) and [current OpenClaw notes](openclaw-notes.md). The architecture below remains a product-level proposal beyond that first capability proof.

```text
OpenClaw Gateway + canal de conversa (WhatsApp/Telegram/Discord/iMessage/web ou outro)
  ├── bridge de canal → contrato de identidade/mensagem normalizado
  ├── identidade verificada → farm_user → roles/capabilities → request/job
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

## Bridge de canal e identidade da aplicação

A aplicação não depende do canal que originou uma mensagem. Cada integração converte seu evento para um contrato neutro de canal, preservando separadamente `channel`, `external_sender_id`, `external_account_id`, `conversation_context` e `attachment_reference`. O bridge valida a identidade externa e a referência de mídia e então resolve a identidade verificada para `farm_users`; a autorização deriva dos papéis/capacidades persistidos, e o domínio associa a ação a um request/job. Identificadores de transporte e detalhes de sessão ficam no bridge; não entram nas regras centrais de autorização, pedido, ordem ou job.

```text
evento do canal
  → { channel, external_sender_id, external_account_id,
      conversation_context, attachment_reference }
  → identidade externa verificada
  → farm_user → roles/capabilities
  → request/job
```

Em grupos, `external_sender_id` identifica a pessoa que enviou a mensagem; `conversation_context` identifica o grupo. O ID do grupo nunca substitui o remetente na autorização. Sessões OpenClaw continuam sendo contexto de conversa, não ACL do produto. O trust domain operacional continua sendo uma instalação OpenClaw confiável por farm.

## Direção WhatsApp público e identidade de primeiro contato — MVP

WhatsApp DM público é o destino preferido para intake de clientes no Brasil. No ambiente Stage 5 de desenvolvimento, o DM está configurado como `open` para provar o caminho CUSTOMER; isso não declara o canal pronto para produção. O canal deve voltar a `pairing`/pausado se o bridge ou a superfície de autorização CUSTOMER estiverem incompletos. Pareamento continua adequado para desenvolvimento e canais internos, mas não é a experiência final de cadastro público.

No primeiro pedido/STL válido vindo de um DM público, o bridge cria ou resolve a identidade verificada como `farm_user` CUSTOMER. A superfície pública limita as capacidades efetivas a `request.submit` e `request.read_own`, mesmo que uma identidade esteja vinculada a um usuário que possua papéis internos. Mensagens sem pedido/STL não criam usuário. Remetentes desconhecidos não consultam orçamento, pedido ou outros dados históricos; identidade não vinculada nunca é associada automaticamente por nome ou número.

Papéis OWNER/OPERATOR exigem vínculo e concessão explícitos no aplicativo e chegam apenas por entry points internos restritos. Vincular outra identidade de canal a um `farm_user` existente exige aprovação de OWNER. Telegram, grupos privados de WhatsApp e outros canais internos usam pairing/allowlist; grupos permanecem bloqueados por padrão até que haja uma allowlist e verificação do remetente individual. Nenhum grupo ou conversa substitui `external_sender_id`.

Após os testes locais de autorização passarem, a configuração deste Gateway foi alterada para `dmPolicy: open` e `allowFrom: ["*"]`, com o hook inbound opt-in. Isso permite receber novas solicitações, não concede acesso interno. Grupos continuam desabilitados, o submit ocorre no hook determinístico e as ferramentas públicas do plugin são status do próprio intake, leitura do próprio job e resolução de ambiguidade; o status usa um tool estreito por remetente e não ativa o grant amplo de acesso ao contexto da conversa. A política é temporária para o MVP; a integração está conectada e aguarda um novo teste externo, sem criar lock-in.

Texto e anexos são eventos independentes do transporte. O bridge normaliza cada evento para `channel`, `account_id`, `sender_id`, `conversation_id`, `message_id`, `text?`, `attachments[]` e `timestamp`; a camada de aplicação persiste pedidos e anexos pendentes por até 30 minutos. O hook `message_received` do OpenClaw expõe `content` voltado ao agente, sem um campo de corpo bruto separado; em evento com mídia, o conteúdo pode ser um envelope gerado e é ignorado como texto do pedido. Arquivos locais são aceitos somente dentro da raiz privada de mídia do OpenClaw configurada no plugin, com validação de caminho, symlink, tipo e tamanho. A correlação exige igualdade de canal, conta, remetente e conversa. Ela suporta texto→anexo e anexo→texto, deduplica redelivery e só faz matching automático quando existe um único par possível. A fila usa ordem FIFO apenas quando o pareamento é inequívoco; múltiplos candidatos ficam pendentes e pedem escolha explícita. IDs de sessão continuam fora da autorização e da correlação.

Os bytes pendentes ficam em diretório privado com validação STL, limite de 25 MiB, digest e caminhos gerados; nenhum caminho do host chega a analyzer ou slicer. Uma seleção consome o anexo uma vez e usa `intake_id` idempotente para recuperação após restart. Pedidos abandonados e anexos pendentes expiram em 30 minutos; limpeza roda no Gateway startup e a cada cinco minutos. A ingestão persiste no hook independentemente do ciclo de vida do turno do agente.

O pedido referencia um `ModelSource` genérico. Stage 5 implementa somente `ATTACHMENT` com STL local validado. Como requisito futuro, a arquitetura prevê `ModelSource(type=URL)` seguido por `ModelResolver` para links de MakerWorld, Thingiverse, Printables e fontes compatíveis; download, scraping e resolução remota não fazem parte do MVP. O fluxo futuro é bridge → evento normalizado → correlator → `ModelSource` → resolver → arquivo privado validado → análise → `SlicerAdapter`.

## Direção temporária de canais

Para o primeiro piloto brasileiro, WhatsApp é a opção preferida para entrada de clientes. Telegram é uma opção inicial conveniente para OWNER/OPERATOR, sem ser requisito de produto. Discord, grupos de WhatsApp, Telegram, iMessage, web/chat e outros canais suportados continuam possíveis como entry points, desde que implementem o mesmo contrato de bridge e as mesmas verificações de identidade e autorização. Plow, Latch e iMessage podem ajudar no hackathon; nenhum deles é dependência da arquitetura do produto. Esta é uma decisão atual de produto/integração, sujeita a revisão por evidência de onboarding e operação, e não um lock-in de fornecedor.

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

Fontes: [OpenClaw install](https://docs.openclaw.ai/install), [multi-user mode](https://docs.openclaw.ai/concepts/multi-user), [WhatsApp channel](https://docs.openclaw.ai/channels/whatsapp), [Agent Index publish](https://aiworthusing.com/agent-index/publish), [Agent Index client](https://github.com/plow-pbc/agent-index-client).
