# POC — 3D Print Farm Employee

Pesquisa em 26/09/2026 para um projeto novo em `print-farm-openclaw-agent/`, independente do agente Hermes anterior. Os testes são locais e não envolveram impressora física. “Testado” significa executado neste ambiente; não significa precisão industrial.

## 1. Executive Summary

✅ **TESTADO:** CuraEngine 5.0.0 em container Debian Trixie fatiou quatro STL de amostra, em menos de um segundo de tempo de execução por arquivo, produzindo G-code e métricas de tempo/volume no console verbose. Uma CLI analisa dimensões e malha; outra compõe slicer, orçamento e sugestão de uma farm simulada.

🟡 **INVESTIGADO:** PrusaSlicer tem CLI e presets, mas a tentativa Debian só confirmou opções; não gerou slice. OctoPrint e Moonraker documentam operações úteis para estado e job, sem teste contra instância ou hardware real. A documentação oficial do OpenClaw descreve modo multiplayer, mas não o instalamos aqui.

🔴 **HIPÓTESE / AINDA NÃO ENTREGÁVEL:** o funcionário OpenClaw, autorização por papéis/canais, experiência Plow 1-click e integração de impressora. Portanto esta pasta é evidência e POC, ainda não é submissão que cumpra o hackathon.

Recomendação: reduzir o MVP para **intake de STL → análise/slice com preset escolhido e confirmado → orçamento estimado → aprovação manual → fila persistida e atribuição manual/mock**, com cliente e usuário(s) da empresa conversando com o mesmo agente em ambiente confiável. Cliente, operador e proprietário representam papéis; proprietário e operador podem ser a mesma pessoa. A necessidade crítica antes de publicar é validar OpenClaw Multiplayer e impedir exposição cruzada dos STLs e pedidos.

As exigências foram conferidas nas fontes oficiais do [evento Luma](https://luma.com/zhkhsnpa), [Agent Index](https://aiworthusing.com/agent-index), [guia de publicação](https://aiworthusing.com/agent-index/publish) e [documentação OpenClaw](https://docs.openclaw.ai/concepts/multi-user). O evento exige OpenClaw 2.0 multiplayer, trabalho real, licença MIT, client para uso, submissão no Index, demo de pelo menos 60s e proíbe uso artificial. Até a submissão em 28/09 23:59 PT há cerca de 2 dias; em São Paulo, 03:59 de 29/09.

## 2. O que funciona hoje

- ✅ **TESTADO:** build isolado `Dockerfile.cura`; CuraEngine 5.0.0 CLI; análise STL de fixtures; quote engine configurável; sugestão de impressora mock; saída E2E JSON.
- ✅ **TESTADO:** `docs/` documenta regras, perfis, limitações, métricas, integrações, scheduling e arquitetura recomendada.
- ✅ **TESTADO:** as alterações feitas durante a auditoria no checkout Hermes foram restauradas; `git status` desse checkout ficou limpo.
- 🟡 **INVESTIGADO:** OpenClaw recomenda skill em diretório com `SKILL.md` e metadados YAML; ferramentas/plugin seriam a superfície de código local. Nenhuma skill foi instalada num runtime nesta rodada.
- 🔴 **HIPÓTESE:** cliente externo aprova o orçamento no mesmo workspace multiplayer, ferramenta mantém histórico de pedidos entre sessões e horários/capacidade refletem a produção real.

Comando reproduzível desde a raiz:

```sh
python3 experiments/stl-analysis/make_samples.py
docker build -f Dockerfile.cura -t print-farm-cura-poc .
python3 experiments/slicing/run_cura.py
python3 experiments/e2e.py experiments/stl-analysis/samples/small-box-20mm.stl --quantity 4
```

## 3. O que foi testado

| Área | Tecnologia | Resultado | Confiabilidade |
|---|---|---|---|
| Slicing | CuraEngine 5.0.0 Debian Trixie | ✅ 4/4 STL geraram G-code; 0.87–0.97s cada | Alta para “executa neste container”; baixa para previsão física |
| Alternativa slicer | PrusaSlicer Debian `2.9.2+UNKNOWN` | 🟡 CLI e flags confirmadas; config vazia falha; nenhum slice | Baixa; não há comparação quantitativa |
| Slicer alternativo | OrcaSlicer | 🔴 Não instalado/testado | Nenhuma |
| STL | Python stdlib (analyzer próprio) | ✅ bounds, dimensão, volume heurístico, contagem de triângulos e componentes | Média nas amostras; STL não informa unidades e validação não substitui reparador |
| Orçamento | Python, preço paramétrico | ✅ material + hora máquina + energia + margem + quantidade | Alta para fórmula; valores de negócio são hipóteses |
| Farm e scheduling | JSON + heuristic earliest compatible finish | ✅ seleciona máquina em cenário mock | Só simulação; não existe telemetria real |
| API impressora | OctoPrint / Moonraker | 🟡 APIs oficiais lidas; sem chamada/teste | Documental |
| OpenClaw | Multi-user, skills, instalação | 🟡 documentação oficial lida | Sem runtime/prova multiplayer |
| Distribuição/index | Agent Index e guia BYO/Plow | 🟡 processo oficial documentado | Não publicado, registrado, verificado nem deployado |

Detalhes e comandos estão em [slicer-comparison.md](slicer-comparison.md), [printer-integrations.md](printer-integrations.md), [quote-model.md](quote-model.md) e [operational-metrics.md](operational-metrics.md).

## 4. Melhor stack recomendada para o MVP

```text
OpenClaw 2.0 / base Plow OpenClaw (runtime a validar)
+ skill de atendimento + ferramenta Python local com allowlist
+ CuraEngine 5.0.0 em container isolado e perfis explicitamente importados
+ SQLite para pedidos/eventos/configuração local
+ estado de impressora manual primeiro; OctoPrint REST como primeiro adapter real
+ AI Worth Using client e fluxo de publicação/verificação
```

Escolho Cura para o curto prazo porque há slice real e reprodução local no projeto novo. Não recomendo usar o perfil Ender-3 legado como perfil de produção. É obrigatório tratar o CuraEngine e a imagem com análise de licença AGPL antes de publicar/distribuir. Se o deadline tornar essa revisão inviável, não embutir binário sem avaliar obrigações; publicar instruções que baixem/dependam da instalação do usuário também precisa revisão de licenciamento e setup.

## 5. Fluxo do MVP recomendado

```text
cliente manda STL + quantidade + material
→ ferramenta confere arquivo, dimensão, volume e cabimento
→ usuário escolhe perfil exportado/validado
→ Cura retorna tempo e consumo aproximados
→ agente gera orçamento com tabela de custos configurada
→ proprietário, operador ou ambos revisam e aprovam envio
→ cliente aprova pedido
→ pedido e evento ficam registrados
→ agente sugere fila/máquina disponível (manual ou mock)
```

Não iniciar, cancelar ou comandar impressora no primeiro release. A escolha de perfil exige consentimento explícito; não tentar inferir máquina pela conversa livre.

## 6. Capacidades recomendadas para lançamento

- Análise de STL e alerta de dimensões que excedem o volume escolhido.
- Slice sob demanda com poucos perfis importados e versionados pelo operador.
- Orçamento estimado e explicável, com quantidades, custos e margem configuráveis.
- Aprovação do operador antes de encaminhar proposta; confirmação do cliente antes de marcar pedido aprovado.
- Registro de pedidos e atualização manual do status: cotado, aprovado, em fila, imprimindo, concluído, falhou.
- Sugestão de impressora baseada em estado manual (ociosa/offline/ocupada), dimensões XYZ, material e estimativa de término.
- Resumos de fila e consumo estimado; sempre rotular estimativas e origem dos dados.
- Multiplayer apenas entre usuários confiáveis do Gateway/ambiente da farm até controle de acesso ser testado.

## 7. Coisas que NÃO devem entrar no MVP

- Controle automático de qualquer impressora ou múltiplas marcas.
- Cliente final não confiável compartilhando gateway/arquivos com outros clientes.
- Cálculo contábil de lucro, datas de entrega garantidas ou preço automático sem revisão humana.
- Seleção automática de orientação, reparo de malha, estimativa de falha/qualidade ou otimização industrial.
- Garantia de suporte a “Ender 3”, “Bambu” ou família inteira usando apenas o nome do modelo.
- Construir dashboard/front-end; entregar fluxo de trabalho textual e CLI.
- OrcaSlicer e comparação de desempenho até que o caminho OpenClaw e instalação sejam demonstrados.

## 8. Principais limitações

- Perfil de máquina Cura testado é Creality Ender-3 antigo; não Ender 3 V3 SE. 109–110 avisos por slice por settings/defaults ausentes.
- Metadados no arquivo G-code persistiram como `TIME:6666` e `Filament used: 0m`; usar a saída verbose testada, não assumir que header é correto.
- Massa calculada usa densidade PLA assumida 1.24 g/cm³; peso não foi aferido em balança; tempo não foi medido numa impressora.
- STL não traz unidades; analyzer assume mm. Manifoldness é heurística simples. Cura cortou a fixture não-manifold que analyzer rejeitou.
- Sem resultado Prusa/Orca comparável; não sabemos o delta de tempo ou material entre slicers.
- Dados de farm são simulação estática. Nenhuma impressora, API, autenticação ou histórico real conectados.
- OpenClaw multi-user é colaboração confiável, não isolamento de tenant. Upload/STL é input não confiável; executar slicer exige isolamento, limite de tamanho/tempo e política de retenção.
- CuraEngine sob AGPL-3.0-or-later; projeto da aplicação sob MIT não muda a licença do engine. Avaliar distribuição do container e obrigações antes de publicar.
- Build APT usa tags sem pin de digest/versão exata para todos os pacotes; não é build hermético.

## 9. Principais riscos

1. **Hackathon/submissão:** falta runtime OpenClaw executável com Multiplayer, uso do client, registro/validação e demo antes do prazo.
2. **Privacidade/isolamento:** clientes podem receber acesso às ferramentas/arquivos do mesmo gateway compartilhado. Não expor canal cliente até ACL por identidade ser demonstrada.
3. **Orçamento incorreto:** escolha de diâmetro/perfil muda consumo; pedir preço com máquina inadequada pode causar prejuízo. Mostrar origem/versão e pedir aprovação.
4. **Segurança de arquivos:** STL e G-code são artefatos não confiáveis; ferramenta não deve dar ao modelo shell geral, mounts amplos nem rede desnecessária.
5. **Licenciamento/distribuição:** combinar MIT do projeto com CuraEngine AGPL precisa avaliação jurídica/operacional; não presumir compatibilidade automática.
6. **Aquisição:** o leaderboard documenta score por usuários válidos e tokens limitados por usuário; uso genuíno e retenção exigem utilidade recorrente. Não há garantia de posição.

## 10. Multiplayer proposto

- **Cliente:** fornece STL, quantidade/material, recebe proposta e confirma/cancela apenas o próprio pedido.
- **Operador:** confere arquivo/perfil, marca máquina indisponível e atualiza produção.
- **Proprietário:** confirma custos/margens e consulta pedidos, capacidade e métricas agregadas.

O evento exige multiplayer. A documentação do OpenClaw chama o recurso de Multi-user mode: participantes e sessões partilhadas num trust domain. Isso prova a possibilidade conceitual, não prova ACL de produto por papel. Os papéis do produto são capacidades combináveis; a demonstração pode mostrar um usuário proprietário/operador solo ou pessoas distintas em uma equipe. Para o hackathon, preferir equipe interna + um pedido demonstrativo com cliente de confiança ou ambientes separados; não afirmar isolamento de clientes até testar. Ver [hackathon-requirements.md](hackathon-requirements.md).

## 11. Onboarding do usuário

Fluxo-alvo investigado, não implementado:

1. Instalar imagem OpenClaw/Plow e iniciar conversa com o agente.
2. Executar setup que verifica Node/OpenClaw, Docker, slicer e armazenamento.
3. Importar preset Cura compatível ou usar template explicitamente suportado; validar volume/nozzle/material.
4. Configurar custo de filamento, custo/hora, energia, moeda e margem.
5. Cadastrar máquinas e estado manual ou conectar OctoPrint posteriormente.
6. Fazer orçamento de teste com STL local; operador revisa números e perfil.
7. Configurar o usuário proprietário, que também pode operar impressoras; convidar pessoas da equipe quando houver, atribuindo papéis combináveis, e testar permissões em sessões diferentes.
8. Configurar retention e destino de STL/G-code antes de aceitar dados de cliente.

## 12. Demo de 60–90 segundos sugerida

Com ambiente OpenClaw já validado: (0–10s) o proprietário, que também pode operar na configuração solo, pergunta capacidade da farm; (10–25s) cliente envia STL pequeno e pede quatro unidades; (25–40s) agente reporta dimensões, perfil selecionado e orçamento/custos estimados; (40–52s) usuário da empresa revisa o status e aprova o preço; (52–65s) cliente confirma; (65–80s) agente grava job e sugere impressora livre, explicando que seleção/estado é manual ou via integração; (80–90s) o proprietário consulta fila e resumo. Em uma demonstração de equipe, pessoas diferentes podem atuar nessas etapas. Filmar o agente executando operações reais do fluxo, deixando claro quando a farm é mock. Não apresentar a POC atual como OpenClaw multiplayer: isso ainda não foi executado.

## 13. Distribuição

ICP: pequeno negócio de impressão 3D ou print farm que recebe trabalhos reais de clientes, como encomendas personalizadas, e precisa cotar e acompanhar produção. Pode ser uma operação solo ou uma equipe; proprietário e operador são papéis combináveis. Hobbyistas sem fluxo de negócio não são o alvo principal. Primeiro piloto self-hosted Linux x86_64 com um preset e sem controle automático. O host precisa estar perto da farm/rede local para acesso ao slicer/OctoPrint. O guia oficial permite BYO agent ou imagem base `plow-openclaw-agent`; recomenda 1-click por Plow e requer contato/admin para habilitar. O POC não foi publicado nem indexado.

## 14. Trabalho necessário até submissão

### P0

- Executar OpenClaw 2.0 real e demonstrar sessões de cliente e da empresa em multiplayer, cobrindo configuração solo (proprietário + operador na mesma pessoa) e equipe.
- Fazer ferramenta limitada e segura chamar analyzer/slicer/quote de diretório de trabalho por job; validar tamanho, timeout, caminhos e erro.
- Persistir pedido/aprovação em SQLite; cortar uso de farm mock da narrativa do produto ou rotulá-lo claramente.
- Construir imagem OpenClaw baseada no fluxo Plow recomendado ou definir BYO; cumprir licença/publicação MIT e documentar licença Cura.
- Adicionar AI Worth Using client, rodar dry-run/register, reportar uso sem fabricar tokens e buscar verificação.
- Gravar demo real de 60s+ e submeter até 28/09 23:59 PT.

### P1

- Importação/validação de preset Cura e setup inicial guiado.
- Atualização manual de status e relatório diário de fila/capacidade.
- Primeiro adapter OctoPrint read-only contra instância de teste autorizada.
- Teste de retenção e remoção de arquivos de job.

### P2

- Moonraker, controle start/pause/cancel com confirmação.
- Comparativo slice real com Prusa/Orca e validação física de previsão.
- Preço/margem calibrados contra histórico financeiro; packing, orientação, batches e qualidade.
- Histórico de falhas/utilização e automação de relatórios.

## 15. Decisões que o humano precisa tomar

1. O primeiro release mantém clientes externos dentro do mesmo Gateway confiável ou começa só como copiloto interno da equipe? Recomendação: interno até ACLs serem provadas.
2. O projeto enviará/redistribuirá container CuraEngine AGPL? Fazer revisão de compliance antes da imagem pública.
3. Existe acesso rápido a uma instância OctoPrint/impressora de teste? Sem isso, manter status manual e excluir controle real.
4. O fluxo Plow OpenClaw 1-click é viável dentro da janela? Caso contrário, decidir explicitamente se BYO agent hospedado/reproduzível atende aos passos oficiais e se dá tempo de verificar.

## 16. Recomendação final

**A evidência atual sustenta uma POC MIT de orçamento local e fila sugerida, mas ainda não sustenta publicar isto como agente OpenClaw instalável ou como submissão conforme.** Para chegar a uma versão publicável até 28/09, é preciso completar OpenClaw 2.0 multiplayer, ferramenta restrita, client/reporting, verificação e demo. A integração física pode ficar de fora. Se o multiplayer/runtime real não for validado, o projeto não cumpre as regras e não deve ser anunciado como submissão elegível. Não alterei o agente Hermes anterior; adaptação ou integração entre os dois pode ser avaliada depois como tarefa separada.
