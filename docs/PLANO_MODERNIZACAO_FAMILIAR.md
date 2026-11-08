# Plano de modernização familiar — Radar 2.0

## Objetivo
Modernizar aluguel, compra, veículos e voos para uso individual e familiar, mantendo a branch main intacta até revisão e aprovação do pull request.

## Decisões
- Autenticação individual via Supabase Auth.
- Dados gerais dos anúncios compartilhados no espaço familiar.
- Avaliações, favoritos, observações e configurações privados por usuário.
- Usuário proprietário como administrador.
- Trabalho isolado em feature/radar-2.0-family-modernization.

## Modelo proposto
- family_spaces: espaços familiares.
- family_members: associação de usuários ao espaço, com papéis admin/member.
- user_listing_preferences: preferências privadas por usuário, domínio e anúncio.
- Domínios: rent, purchase, vehicle e flight.

## Segurança
- RLS em todas as tabelas novas.
- Cada usuário só consulta e altera suas preferências.
- Validar associação familiar em operações compartilhadas.
- Gestão de membros por administradores e fluxo seguro de convite.
- Nunca expor service_role no frontend.
- Não remover políticas legadas antes da substituição e dos testes.

## Fases
1. Verificar repositório e políticas RLS ativas no Supabase.
2. Implementar migração aditiva do modelo familiar.
3. Implementar autenticação, recuperação de senha e gestão familiar.
4. Integrar os quatro módulos.
5. Corrigir XSS, sincronização, tratamento de erros e feedback.
6. Testar isolamento entre duas contas e regressões.
7. Abrir PR para revisão; não fazer merge sem aprovação.

## Dados existentes
- Não apagar tabelas ou dados legados na migração inicial.
- Não atribuir dados antigos sem regra explícita de propriedade.
- Fazer backup antes de alterações no Supabase.
- Auditoria inicial foi estática; políticas remotas ainda precisam ser verificadas.

## Critérios de aceite
- Usuários distintos não acessam preferências uns dos outros.
- Membros só acessam o próprio espaço familiar.
- Administração de membros ocorre por fluxo autenticado.
- Os quatro módulos não expõem segredos no navegador.
- Falhas de rede nunca são apresentadas como sucesso.
