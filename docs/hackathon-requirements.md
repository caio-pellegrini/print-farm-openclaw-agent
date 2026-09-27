# Requisitos oficiais do hackathon

Fonte principal: [página oficial do evento no Luma](https://luma.com/zhkhsnpa), consultada em 26/09/2026. A [página oficial de publicação](https://aiworthusing.com/agent-index/publish) e o [Agent Index](https://aiworthusing.com/agent-index) esclarecem publicação, implantação e pontuação.

## Requisitos que afetam o MVP

- **OpenClaw 2.0 + multiplayer:** obrigatório. A documentação atual do OpenClaw descreve o recurso como *Multi-user mode*: várias pessoas de confiança operam o mesmo agente, com sessões atribuídas, participantes e presença. Essa colaboração não é uma barreira de segurança; operadores compartilham o trust domain do Gateway e suas ferramentas/arquivos. Fonte: [OpenClaw Multi-user mode](https://docs.openclaw.ai/concepts/multi-user).
- A documentação oficial chama a release `v2026.8.1` de “AKA OpenClaw 2.0”; o número de versão estável mudou desde então. Use OpenClaw 2.0 ou release posterior compatível, e confirme o multiplayer no runtime escolhido. Fonte: [release notes](https://docs.openclaw.ai/releases/2026.8.1).
- **Trabalho real:** o agente deve executar uma responsabilidade real para startup; a página do evento exclui demo/mock como trabalho final.
- **Interação de outras pessoas:** clientes, funcionários ou fornecedores devem conseguir operar o agente.
- **MIT e publicação:** repositório/imagem público e MIT, submissão pelo Agent Index.
- **Medição de uso:** uso do [AI Worth Using client](https://github.com/plow-pbc/agent-index-client) é regra explícita. O caminho BYO publicado recomenda executar `agent_index_client.py` em intervalo de cinco minutos, validar com `--dry-run`, e registrar com `--register`.
- **Verificação e implantação:** página oficial diz que, para qualificar aos prêmios, o agente deve estar MIT, reportar uso e estar verificado; entrar no Discord para verificação e habilitar implantação 1-click pelo leaderboard. 1-click aparece no fluxo recomendado de publicação, mas não no texto da regra do evento como requisito autônomo.
- **Vídeo:** demo de no mínimo 60 segundos.
- **Uso legítimo:** sem spam ou tráfego artificial; haverá chamada de verificação para finalistas.
- **Prazo:** submissão até segunda-feira, 28/09, 23:59 PT; snapshot do Top 5 em 30/09, 23:59 PT. PT está 4 horas atrás de São Paulo nesta data; ambos correspondem a 03:59 BRT do dia seguinte (29/09 e 01/10).

## Multiplayer aplicável à print farm

Uma conversa de trabalho compartilhada pode representar o pedido do cliente, a aceitação, a fila e atualização de quem opera; quem é proprietário consulta os mesmos registros operacionais. Cliente, Operador e Proprietário são papéis, não pessoas obrigatoriamente distintas: em uma operação solo, a mesma identidade pode ser Proprietário + Operador; uma equipe pode dividir ou combinar esses papéis. Use perfis autenticados para atribuir sessões e registrar participação. Não exponha conversas de clientes entre si: o modo multi-user é colaboração dentro de um Gateway confiável, não isolamento por organização/cliente. Até demonstrar autorização por canal/identidade, faça cliente e equipe usarem superfícies/sessões separadas com ACLs adequadas.

## Agent Index: métrica atual

O Agent Index hoje mostra: `score = valid users × sum(tokens per user capped at 100M)`. Um usuário válido excede 200k tokens e esteve ativo nos últimos 28 dias. Isso atualiza a hipótese histórica de que somente usuários/tokens brutos explicam o ranking. Não há fórmula oficial que permita inferir desempenho a partir de screenshots antigos; crescer com usuários e uso reais continua sendo a única estratégia compatível com as regras.

## Publicação e Plow

A organização permite usar agente próprio ou Plow. O guia BYO pede cliente, execução recorrente e registro do agente; o caminho Plow parte de uma imagem base e usa `plow-agents`. O guia descreve push de imagem pública e habilitação administrativa de 1-click deploy. Este diretório é uma POC nova para OpenClaw, separada do agente Hermes anterior; ainda faltam runtime OpenClaw, publicação e verificação.

## Decisões que decorrem das regras

1. Priorizar fluxo de orçamento e fila que funcione com artefatos reais e dados locais.
2. Demonstrar cliente + usuário da empresa colaborando via multiplayer OpenClaw, com permissões deliberadas; o usuário da empresa pode ser owner/operator solo ou membro de uma equipe.
3. Adicionar licença MIT, cliente/registro/verificação e instruções instaláveis antes de submeter.
4. Não afirmar 1-click como regra do hackathon; tratá-lo como meta de distribuição que depende da habilitação do organizador.
