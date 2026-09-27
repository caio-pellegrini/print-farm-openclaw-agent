# Ideias descobertas

## Triage automático de pedido sem controlar a impressora

Receber arquivo → reportar dimensões/cabimento → preparar orçamento com perfil aprovado → operador confirma → registrar pedido/fila.

### Valor

Fecha a primeira parte do trabalho diário e permite resposta mais rápida ao cliente.

### Complexidade

Média (slicer e presets), alta para ingestão de arquivo seguro e canal multiplayer de cliente.

### Dependências

Slicer local, presets, ACLs por pedido, persistência.

### MVP?

Sim, com máquina/farm manual ou simulada, sem start remoto.

## Importar preset existente

Pedir ao usuário para carregar bundle Cura/Prusa exportado, validar versão e dimensões; reduz a promessa arriscada de adivinhar “modelo + PLA”.

### Valor

Melhor precisão e setup explicável.

### Complexidade

Baixa/média; dependerá da engine escolhida.

### Dependências

CLI que carregue o formato e teste de presets.

### MVP?

Sim, se PrusaSlicer confirmar bom headless; senão future.

## Diário de manutenção

Operador marca impressora indisponível e causa; o agente não aloca novos jobs até reativação.

### Valor

Reduz erro operacional e dá contexto de farm.

### Complexidade

Baixa.

### Dependências

Persistência e interação staff.

### MVP?

Sim, manual.

