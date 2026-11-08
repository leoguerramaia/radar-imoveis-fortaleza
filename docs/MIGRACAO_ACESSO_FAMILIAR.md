# Migração de acesso familiar — Radar 2.0

## Arquivo
`supabase/migrations/202611080001_family_access.sql`

## O que cria
- `family_spaces`: espaço compartilhado da família.
- `family_members`: vínculo entre usuários do Supabase Auth e o espaço, com papel `admin` ou `member`.
- `user_listing_preferences`: avaliações, favoritos e observações privados por usuário para os domínios `rent`, `purchase`, `vehicle` e `flight`.

## Proteções implementadas
- RLS habilitado nas três tabelas.
- Usuários anônimos não recebem privilégios nas novas tabelas.
- O usuário só lê, insere, atualiza ou exclui suas próprias preferências.
- A operação de preferências também exige que o usuário seja membro do espaço informado.
- Membros só consultam os demais membros do mesmo espaço.
- Apenas administradores podem alterar o nome do espaço.
- A criação do espaço e do primeiro administrador ocorre de forma atômica pela RPC `public.create_family_space(text)`, que delega para uma função privilegiada no schema `private`.
- As funções `SECURITY DEFINER` ficam no schema `private`, com `search_path` vazio e privilégios de execução restritos. Confirme que `private` não está listado entre os schemas expostos na configuração da Data API.
- Não há inclusão direta de membros pelo navegador. Convites exigem uma Edge Function ou outro fluxo servidor autenticado e validado.

## O que NÃO faz
- Não modifica nem remove `property_ratings` ou `property_notes`.
- Não altera políticas legadas existentes. Na inspeção somente leitura de 08/11/2026, foram confirmadas policies permissivas `USING (true)` / `WITH CHECK (true)` em `property_ratings` e `property_notes`; elas permanecem intocadas nesta etapa.
- Não migra automaticamente avaliações ou notas antigas: ainda não existe regra segura para determinar a qual usuário pertencem.
- Não cria convites, envio de e-mail, telas de login ou integração com os módulos HTML.
- Não foi executada no banco Supabase remoto.

## Estado observado no projeto conectado (08/11/2026)
- Projeto: `Imoveis` (`kpvhfjthmkgiddfcsslw`), ativo e saudável.
- Tabelas legadas encontradas: `property_ratings` (86 registros na consulta de contagem) e `property_notes` (5 registros).
- RLS está habilitado nas duas tabelas, mas as policies existentes permitem acesso público amplo.
- Nenhuma migração registrada no histórico do banco no momento da inspeção.
- O schema `private` ainda não existe. A configuração de schemas expostos pela Data API não foi confirmada pela consulta disponível.

## Antes de executar no Supabase
1. Faça backup do projeto e confirme que está no projeto/ambiente correto.
2. Teste em um projeto de desenvolvimento ou staging.
3. Revise as policies legadas e a estrutura real do banco.
4. Execute a migração pelo Supabase CLI/migrations ou SQL Editor, conforme o fluxo adotado pelo projeto.
5. Teste com duas contas autenticadas distintas: A não pode consultar ou alterar preferências de B.
6. Teste que um usuário de outra família não consegue consultar os membros ou preferências desse espaço.
7. Confirme no Dashboard que o schema `private` não está exposto pela Data API.
8. Rode o Security Advisor e testes automatizados de RLS; só depois planeje a migração dos módulos.
9. Só depois planeje convites e integração dos módulos.

## Observação de segurança
A chave pública/anon pode existir no frontend, desde que RLS esteja corretamente configurado. A chave `service_role` nunca deve ser enviada ao navegador. Esta migração é uma base inicial e precisa ser testada no projeto Supabase real antes de produção.
