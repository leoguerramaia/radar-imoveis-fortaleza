# Passo a Passo: Sincronização de Avaliações e Observações no Supabase

Este guia explica como configurar o seu banco de dados no **Supabase** para salvar e sincronizar em tempo real tanto as classificações por estrelas (1 a 5 ⭐) quanto as **observações e anotações de texto** dos cards (Aluguel, Compra e Veículos), **sem salvar localmente no navegador**.

---

### Passo 1: Acessar o SQL Editor no Supabase
1. Acesse o seu painel em [supabase.com](https://supabase.com/dashboard) e abra o seu projeto (`kpvhfjthmkgiddfcsslw` ou o seu projeto pessoal).
2. No menu lateral esquerdo, clique no ícone **SQL Editor** (`>_`).
3. Clique em **New query**.

---

### Passo 2: Executar o Script SQL de Criação das Tabelas
Copie e cole o código SQL abaixo no editor e clique no botão verde **Run**:

```sql
-- ============================================================================
-- 1. TABELA DE AVALIAÇÕES POR ESTRELAS (1 A 5 ⭐)
-- ============================================================================
create table if not exists public.property_ratings (
  property_id text primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  updated_at timestamptz default now() not null
);

alter table public.property_ratings enable row level security;

drop policy if exists "Acesso publico total ratings" on public.property_ratings;
create policy "Acesso publico total ratings" on public.property_ratings
  for all using (true) with check (true);

-- ============================================================================
-- 2. TABELA DEDICADA DE OBSERVAÇÕES / ANOTAÇÕES (ALUGUEL, COMPRA E VEÍCULOS)
-- ============================================================================
create table if not exists public.property_notes (
  property_id text primary key,
  notes text not null default '',
  updated_at timestamptz default now() not null
);

alter table public.property_notes enable row level security;

drop policy if exists "Acesso publico total notes" on public.property_notes;
create policy "Acesso publico total notes" on public.property_notes
  for all using (true) with check (true);

-- ============================================================================
-- 3. (OPCIONAL) COLUNA DE OBSERVAÇÕES DIRETO NA TABELA DE RATINGS
-- O painel suporta automaticamente ambas as estruturas:
-- ============================================================================
alter table public.property_ratings add column if not exists notes text;
alter table public.property_ratings add column if not exists observacoes text;
```

---

### Passo 3: Como Funciona no Painel
1. **Sem armazenamento local**: Nenhuma observação é gravada no `localStorage` do navegador.
2. **Salvamento Imediato no Supabase**: Ao clicar em **💾 Salvar** no card de qualquer anúncio (imóvel ou veículo), a anotação é enviada via requisição HTTP direta ao Supabase.
3. **Indicador Visual**: O card exibe o status **"✓ Salvo no Supabase"** em verde assim que a confirmação é recebida.
4. **Sincronização Multi-Dispositivo**: Ao abrir o painel no celular, computador ou tablet, todas as observações e estrelas salvas no Supabase são carregadas automaticamente na abertura da página ou ao clicar em **⚡ BUSCAR AGORA** / **☁️ Supabase**.
