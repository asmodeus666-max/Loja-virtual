# Loja Virtual - Clube de Impressão 3D - TODO

## Autenticação e Acesso
- [x] Validar domínio de e-mail @escola.pr.gov.br no OAuth
- [x] Implementar sistema de admins selecionáveis
- [x] Criar página de login com validação de domínio

## Sistema de Moedas
- [x] Criar tabela de moedas/carteira do usuário
- [x] Implementar endpoint para atribuir moedas manualmente (admin)
- [ ] Criar interface admin para gerenciar moedas dos alunos
- [x] Implementar histórico de transações de moedas

## Desafios e Tarefas
- [x] Criar tabela de desafios com perguntas
- [x] Criar tabela de respostas dos alunos
- [x] Implementar sistema de desafios com perguntas de múltipla escolha
- [x] Criar interface para visualizar desafios disponíveis
- [x] Implementar verificação automática de respostas
- [ ] Criar banco de perguntas padrão (Ciências, Português, Matemática, História, Geografia)
- [x] Implementar sistema de pontuação (10 moedas por desafio completo)
- [ ] Criar interface admin para gerenciar desafios

## Catálogo de Produtos
- [x] Criar tabela de produtos
- [ ] Implementar upload de imagens para produtos
- [x] Criar página de catálogo com listagem de produtos
- [ ] Implementar filtros e busca de produtos
- [ ] Criar interface admin para gerenciar produtos

## Sistema de Compras
- [x] Criar tabela de pedidos
- [x] Implementar lógica de compra (débito de moedas)
- [x] Validar saldo antes de permitir compra
- [ ] Criar página de carrinho de compras
- [x] Implementar checkout

## Painel Administrativo
- [x] Criar layout do painel admin
- [x] Implementar aba "Pedidos Pendentes"
- [x] Implementar aba "Pedidos Entregues"
- [ ] Implementar aba de gerenciamento de produtos
- [ ] Implementar aba de gerenciamento de moedas
- [ ] Implementar aba de gerenciamento de admins
- [ ] Implementar aba de gerenciamento de desafios

## Notificações
- [ ] Implementar notificação por e-mail quando pedido é feito
- [ ] Implementar notificação no site quando pedido é feito
- [ ] Implementar notificação no site quando pedido é entregue

## Design e Estilo
- [x] Aplicar cores azul e preto no design
- [x] Criar componentes visuais da loja
- [x] Implementar responsividade mobile
- [x] Criar ícones e elementos visuais temáticos

## Testes
- [x] Escrever testes unitários para lógica de moedas
- [ ] Escrever testes para sistema de desafios
- [ ] Escrever testes para sistema de compras
- [ ] Escrever testes para autenticação

## Deploy
- [ ] Criar checkpoint antes de publicar
- [ ] Publicar projeto


## Bugs Encontrados
- [x] Adicionar botão de voltar em todas as páginas (Catálogo, Desafios, Painel Admin)
- [x] Implementar interface admin para adicionar/editar/deletar produtos
- [ ] Implementar interface admin para gerenciar admins (adicionar/remover)
- [x] Reforçar validação de login para aceitar apenas @escola.pr.gov.br
- [x] Recusar login de usuários com outros domínios de e-mail


## Melhorias Solicitadas
- [x] Refatorar página principal para ser o catálogo
- [x] Adicionar mini aba de navegação no topo
- [x] Implementar interface para gerenciar admins (adicionar/remover)
- [x] Melhorar design visual com mais cores e detalhes
- [x] Adicionar gradientes e efeitos visuais


## Bugs Mobile Reportados
- [x] Corrigir layout responsivo da NavBar para celular
- [x] Corrigir layout responsivo do catálogo e cards de produtos
- [x] Corrigir layout responsivo da página de desafios
- [x] Corrigir layout responsivo do painel administrativo
- [x] Testar em múltiplos tamanhos de tela


## Melhorias de Design Solicitadas
- [x] Simplificar card de saldo na página inicial
- [x] Mudar fundo para design mais tecnológico e moderno


## Últimas Mudanças Solicitadas
- [x] Mover saldo para canto fixo sempre visível
- [x] Mudar nome da loja para 3D LabShop


## Mudanças Finais Solicitadas
- [x] Remover card de saldo da página do catálogo
- [x] Criar nova logo para 3D LabShop
- [x] Integrar nova logo na NavBar


## Bugs Críticos a Corrigir
- [ ] Implementar funcionalidade de adicionar pessoas como admin
- [ ] Implementar funcionalidade de criar desafios
- [ ] Trocar logo pela nova versão com fundo transparente
- [ ] Mostrar saldo de moedas na versão mobile


## Bugs Críticos Reportados - Rodada 2
- [x] Implementar upload de imagens para produtos no catálogo
- [x] Implementar funcionalidade de deletar produtos
- [x] Corrigir exibição de saldo na versão mobile
- [x] Implementar exclusão de desafios
- [x] Implementar adição de perguntas aos desafios
- [x] Implementar funcionalidade de iniciar desafios


## Bugs Críticos - Rodada 3
- [x] Corrigir erro ao deletar produto (erro de constraint no banco)
- [x] Corrigir problema de login para novos usuários


## Bugs Críticos - Rodada 4
- [x] Corrigir mensagens de erro de autenticação para usuários
- [x] Permitir que usuários vejam exatamente qual é o problema no login

## RODADA FINAL - IMPLEMENTAR TUDO
- [x] CORRIGIR LOGIN (problema crítico) - ✅ LOGIN FUNCIONANDO PERFEITAMENTE
- [x] Criar banco de perguntas padrão (Ciências, Português, Matemática, História, Geografia)
- [x] Implementar notificações por e-mail quando pedido é feito
- [x] Implementar notificações por e-mail quando pedido é entregue
- [x] Implementar notificações no site para pedidos
- [x] Implementar carrinho de compras
- [x] Implementar filtros e busca de produtos
- [x] Escrever testes para sistema de desafios
- [x] Escrever testes para sistema de compras
- [x] Escrever testes para autenticação
- [x] Testar login com novo usuário
- [x] Testar fluxo completo: login -> compra -> desafio -> checkout
- [x] Testar responsividade mobile completa

## Bug Fix - Invalid Hook Call
- [x] Corrigir trpc.useUtils() chamado dentro de callbacks (onSuccess) no AdminPanel.tsx
- [x] Corrigir trpc.useUtils() chamado dentro de callbacks (onSuccess) no Challenges.tsx
- [x] Mover utils = trpc.useUtils() para o topo dos componentes

## Bug - OAuth redirect_uri inválido
- [x] Corrigir erro "redirect_uri domain not allowed" ao fazer login pelo domínio publicado
- [x] Garantir que o OAuth usa window.location.origin para redirect_uri
- [x] Melhorar parseState no oauth.ts para suportar ambos os formatos (JSON e URL)

## Correção Mobile - Design e Layout
- [x] Auditar todas as páginas em viewport mobile
- [x] Corrigir NavBar mobile (overflow, espaçamento, menu hamburger)
- [x] Corrigir página principal mobile (hero responsivo, badges empilhados)
- [x] Corrigir página de desafios mobile (grid adaptativo, header empilhado)
- [x] Corrigir painel admin mobile (tabs grid-cols-3, formulários responsivos)
- [x] Corrigir página de catálogo mobile (header empilhado, saldo compacto)
- [x] Testar responsividade - console limpo, sem erros


## BUG CRÍTICO - Permissão de Login
- [x] CORRIGIR: Novos usuários com @escola.pr.gov.br estão recebendo "sem permissão" ao tentar fazer login
- [x] Verificar código de autenticação e permissões - ACHADO: falta de validação de domínio no authenticateRequest
- [x] Testar com nova conta @escola.pr.gov.br - CORRIGIDO: adicionada validação de @escola.pr.gov.br no sdk.ts
