# Licenças e distribuição

O arquivo root [LICENSE](../LICENSE) MIT cobre o material do projeto. **Não
significa que o runtime inteiro do container seja MIT.** CuraEngine é AGPL-3.0-or-later; a imagem Docker instala esse binário e distribui definições Cura. A distribuição pública precisa acompanhar avisos/licenças e código-fonte correspondente exigido pelas licenças dos componentes, incluindo dependências do pacote. Avaliar com responsável pela distribuição antes de publicar.

O OpenClaw oficial é MIT; fontes: [FAQ OpenClaw](https://docs.openclaw.ai/help/faq/what-is-openclaw) e [repositório](https://github.com/openclaw/openclaw). O hackathon pede agente público MIT e cita AI Worth Using client.

## Decisão temporária de canais e distribuição

Para o piloto brasileiro, WhatsApp é a opção preferida para clientes. Telegram é uma opção inicial para comunicação interna de OWNER/OPERATOR, sem requisito obrigatório. Discord, grupos de WhatsApp, Telegram, iMessage, web/chat e outros canais suportados seguem elegíveis como futuras entradas. Plow, Latch e iMessage são opções que podem ser úteis para o hackathon, não pressupostos da arquitetura nem dependências de distribuição do produto. A escolha atual guia apenas a integração inicial e pode ser revista conforme onboarding, segurança, custo e uso real; não implica lock-in.

No MVP, WhatsApp pairing é apenas para desenvolvimento/teste; aprovação manual por cliente não é a UX final. Após passar os testes locais de autorização CUSTOMER, o Gateway deste piloto foi configurado para DM público/open e hook inbound; a prova com remetente/STL reais ainda está pendente. Um novo sender vira CUSTOMER apenas ao enviar um pedido/STL válido; a rota pública nunca concede capacidade OWNER/OPERATOR, e lookup de orçamento/pedido histórico para identidade não vinculada permanece fora de escopo. OWNER/OPERATOR entram por canais internos restritos com identidade vinculada e papel explícito. Esta é uma decisão de produto/integração revisável, não um compromisso permanente com WhatsApp.

Toda distribuição deve preservar um bridge por canal que normalize remetente, conta, contexto de conversa e referência de anexo para o contrato da aplicação. O domínio recebe uma identidade já verificada e um `farm_user`; não conhece IDs de transporte. Em grupos, o remetente permanece separado do identificador de grupo e é a identidade do remetente que se autoriza. Não se deve tratar um Gateway compartilhado como isolamento entre farms: cada farm mantém uma instalação OpenClaw confiável própria.

PrusaSlicer upstream é AGPL-3.0-or-later: [repositório oficial](https://github.com/prusa3d/PrusaSlicer). O pacote Debian usado para investigação é empacotado pela distribuição e não deve ser presumido idêntico/validado pela Prusa; fabricante recomenda a via Linux Flatpak/DRIVERS. OrcaSlicer upstream também AGPL conforme repositório; revisar dependências/licenças antes de embutir.
