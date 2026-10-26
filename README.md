# Radar Imóveis & Veículos (Fortaleza/CE e Teresina/PI) — Atualização v7.0

Este pacote contém todas as atualizações implementadas no ecossistema multi-páginas do projeto (`index.html`, `aluguel/index.html`, `compra/index.html` e `veiculos/index.html`):

### 1. Correção de Todos os Links Inter-Páginas (Slug do Repositório GitHub Pages)
- **Problema corrigido**: Todos os links entre as páginas estavam direcionando para `https://leoguerramaia.github.io/aluguel/`, `https://leoguerramaia.github.io/compra/` ou `https://leoguerramaia.github.io/veiculos/`, omitindo o caminho do repositório no GitHub Pages.
- **Estrutura canônica corrigida**:
  - **Página Inicial / Buscador**: `https://leoguerramaia.github.io/radar-imoveis-fortaleza/`
  - **Painel de Aluguel**: `https://leoguerramaia.github.io/radar-imoveis-fortaleza/aluguel/`
  - **Painel de Compra**: `https://leoguerramaia.github.io/radar-imoveis-fortaleza/compra/`
  - **Painel de Veículos**: `https://leoguerramaia.github.io/radar-imoveis-fortaleza/veiculos/`
- Todos os botões do cabeçalho, botões "Abrir Painel", submissão dos formulários com parâmetros via URL e botões "Voltar ao Buscador" / "Editar no Buscador" utilizam a rota canônica completa com `/radar-imoveis-fortaleza/`.

### 2. Correção Definitiva dos Links dos Veículos (Páginas Diretas dos Anúncios)
- **Problema corrigido**: Os links dos veículos estavam direcionando para buscas gerais agregadas da OLX.
- **Solução implementada**: Todos os 18 veículos existentes e o novo veículo qualificado agora possuem links individuais e diretos para o anúncio específico (OLX CE, OLX PI e Jelta Seminovos).
- Tanto o título principal do card quanto o botão inferior **"Ver Anúncio →"** abrem a página oficial do veículo.
- Links diretos de WhatsApp (`https://wa.me/...`) pré-formatados com a mensagem contendo o nome do carro, cidade e valor à vista.

### 3. Campo "Observações" Salvo Diretamente no Supabase (Sem localStorage)
- Em todos os cards de **Aluguel**, **Compra** e **Veículos**, as anotações feitas no campo **"📝 Observações"** são salvas na nuvem (**Supabase** via tabela `property_notes`), sem depender do `localStorage` do navegador, permitindo visualização sincronizada em múltiplos dispositivos.

### 4. Varredura Diária de Veículos (Fortaleza/CE & Teresina/PI)
- Total de veículos monitorados: **19 veículos qualificados** (10 em Fortaleza/CE e 9 em Teresina/PI).
- Critérios estritos: Câmbio Automático / CVT, 4 portas, Ano Mínimo 2022, KM Máximo 40.000 km, Preço Máximo R$ 100.000.
- Novo veículo qualificado adicionado hoje: **Kia Stonic SX 1.0 Turbo Hybrid Aut. 2022** (Apenas 6.000 km, R$ 89.950, Jelta Seminovos Teresina).
- Planilha do Google Sheets sincronizada em tempo real (ID: `1-7I96TOnlGdCgqb7DOf1w_Il11ZPUG6yMnbAofRjjik`).

### Como Publicar no GitHub Pages:
1. Descompacte o arquivo `painel_imoveis_fortaleza.zip` na raiz do seu repositório local.
2. Faça commit e push para o branch principal do repositório `radar-imoveis-fortaleza`:
   ```bash
   git add .
   git commit -m "Corrigir links diretos dos veiculos e adicionar novo veiculo qualificado da varredura"
   git push origin main
   ```


## ✈️ Painel de Monitoramento de Voos (Brasília ↔ Teresina & Recife ↔ Teresina — Fev/2027)
- **Página no Site**: `/voos/index.html` (e arquivo standalone `painel_voos_teresina.html`)
- **Planilha Google Sheets Conectada**: `1dfqDCWxxUJax24ifW_F5OIGyM_AaTdpt-QZE-508Xgc` (`Radar_Voos_Brasilia_Recife_Teresina_Dados`)
- **Buscas Monitoradas Diariamente às 06:00 (Apenas Bagagem de Mão)**:
  1. **Busca 1 (Brasília ↔ Teresina)**: Ida `04/02/2027` a `06/02/2027` | Volta `08/02/2027` a `09/02/2027`
  2. **Busca 2 (Recife ↔ Teresina)**: Ida `04/02/2027` a `06/02/2027` | Volta `08/02/2027` a `09/02/2027`
