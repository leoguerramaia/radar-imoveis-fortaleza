# Plano de coleta automática de imóveis — Radar Fortaleza

## Objetivo
Consolidar anúncios de aluguel residencial em Fortaleza a partir de fontes legítimas, com atualização agendada, deduplicação e histórico. A planilha atual permanece como base legada até que cada registro seja conciliado com uma fonte.

## O que a documentação oficial permite concluir
- O Grupo OLX (OLX, ZAP e Viva Real) documenta feeds XML no padrão **VRSync** para que imobiliárias e anunciantes enviem o próprio inventário aos portais. O processamento descrito é periódico, normalmente duas vezes ao dia. Isso não equivale a uma API pública para pesquisar todo o inventário de terceiros.
- A OLX documenta integrações de anúncios e APIs para anunciantes/integradores autorizados. O acesso exige credenciais/permissões e escopo compatível.
- Imovelweb também trabalha com integração de anúncios via XML a partir do sistema/CRM do anunciante.
- Portanto, o Radar não deve depender de scraping de páginas, contornar bloqueios ou usar credenciais de terceiros.

Referências oficiais:
- Grupo OLX — Feeds: https://developers.grupozap.com/feeds/integration.html
- Grupo OLX — Formatos XML / VRSync: https://developers.grupozap.com/feeds/xml-formats/
- Grupo OLX — Listing VRSync: https://developers.grupozap.com/feeds/vrsync/elements/listing.html
- OLX — Portal de integração: https://developers.olx.com.br/
- OLX — Como importar anúncios: https://ajuda.olx.com.br/s/article/como-importar-anuncios
- Imovelweb — Integração de anúncios: https://help.imovelweb.com.br/s/article/Como-habilitar-uma-integra%C3%A7%C3%A3o-de-an%C3%BAncios

## Estratégia de fontes

| Fonte | Caminho de integração | Situação |
|---|---|---|
| Sites próprios de imobiliárias | Feed VRSync/XML ou API fornecida pela imobiliária | Aguardando URLs e autorização |
| CRM de imobiliárias | Feed exportado pelo CRM, com permissão do anunciante | Aguardando adesão |
| OLX / ZAP / Viva Real | Parceiro/API/feed autorizado; não assumir API pública de busca | Acesso comercial/técnico a validar |
| Imovelweb | Feed/API fornecido por anunciante ou parceiro | Acesso a validar |
| Anúncios avulsos sem feed | Link informado manualmente ou canal de alerta autorizado | Complementar, sem scraping |

## Fluxo técnico proposto
1. Agendador executa a coleta em horário configurável.
2. Cada conector busca apenas a fonte autorizada que lhe foi configurada.
3. Adaptador converte os dados para um modelo canônico.
4. Validação aplica cidade, tipo, preço, quartos, área e dados mínimos.
5. Deduplicação usa fonte + ID do anúncio e, como segunda chave, URL canônica; título/endereço/preço são sinais auxiliares, não identificadores absolutos.
6. Supabase guarda o anúncio atual, fonte, primeira/última captura, alterações de preço e status.
7. Anúncios ausentes de um feed não são removidos imediatamente: ficam como “não confirmado” e só são marcados inativos após política de ausência definida para aquela fonte.
8. O painel consulta a base consolidada e mostra data real da última coleta e estado de cada fonte.

## Modelo mínimo normalizado
- `source_key`, `source_listing_id`, `source_name`
- `canonical_url`, `title`, `property_type`, `transaction_type`
- `city`, `state`, `neighborhood`, `address_display`, `latitude`, `longitude`
- `rent_price`, `condo_price`, `iptu_price`, `total_monthly`
- `bedrooms`, `suites`, `bathrooms`, `parking_spaces`, `area_m2`
- `agency_name`, `phone`, `whatsapp`, `photos`
- `first_seen_at`, `last_seen_at`, `last_checked_at`, `status`
- Histórico separado para alterações relevantes, especialmente preço e disponibilidade.

## Critérios atuais do Radar
Os filtros já definidos no projeto continuam como referência inicial: total mensal até R$ 3.500, pelo menos 3 quartos, área mínima de 70 m², deslocamento estimado de até 20 minutos do ponto de referência e bairros prioritários já configurados. Esses critérios devem ser aplicados após normalização, sem descartar anúncios fora da seleção antes de armazená-los, para permitir ajustar os filtros futuramente.

## Configuração necessária para ativar a coleta
Para cada imobiliária parceira, obter:
- Nome da imobiliária e responsável pelo feed.
- URL HTTPS do feed XML/VRSync ou documentação/API.
- Confirmação de que o Radar pode armazenar e exibir os dados e links.
- Frequência e limites de consulta autorizados.
- Campos de contato e política de atualização/inativação.

**Estado atual:** nenhuma fonte imobiliária autorizada foi cadastrada ainda. O painel está preparado visualmente, mas a coleta multiorigem não deve ser anunciada como ativa até que uma primeira fonte seja conectada e validada de ponta a ponta.
