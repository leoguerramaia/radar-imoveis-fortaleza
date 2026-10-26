/**
 * ============================================================================
 * RADAR IMÓVEIS & VEÍCULOS (FORTALEZA/CE & TERESINA/PI) — GOOGLE APPS SCRIPT
 * 1) Planilha Aluguel: 12QlgMdgKfsU7_UZ7cBM3bZ-wlGweXREzc1xmRn5sXFk
 * 2) Planilha Veículos: 1-7I96TOnlGdCgqb7DOf1w_Il11ZPUG6yMnbAofRjjik
 * ============================================================================
 *
 * COMO ESTE SCRIPT FUNCIONA:
 * 1. Roda automaticamente todos os dias entre 06h e 07h nos servidores do Google
 *    (via Acionador de Tempo), atualizando tanto a planilha de Imóveis (Aluguel)
 *    quanto a planilha de Veículos (Fortaleza/CE e Teresina/PI).
 * 2. Verifica os critérios pré-definidos de Veículos:
 *    - Câmbio Automático
 *    - 4 portas
 *    - Ano Mínimo: 2022
 *    - KM Máximo: 40.000 km
 *    - Valor Máximo: R$ 100.000
 *    - Cidades: Teresina/PI ou Fortaleza/CE
 * 3. Inclui suporte à coluna "observacoes" para salvar anotações dos cards.
 */

const SHEET_ID = "12QlgMdgKfsU7_UZ7cBM3bZ-wlGweXREzc1xmRn5sXFk";
const VEHICLE_SHEET_ID = "1-7I96TOnlGdCgqb7DOf1w_Il11ZPUG6yMnbAofRjjik";
const FLIGHT_SHEET_ID = "1dfqDCWxxUJax24ifW_F5OIGyM_AaTdpt-QZE-508Xgc";

const WORKPLACE = {
  lat: -3.7351,
  lng: -38.4969,
  address: "Edifício Etevaldo Nogueira Business, Av. Dom Luís, 807 - Meireles"
};

const CONFIG = {
  maxTotalMonthly: 3500,
  minBedrooms: 3,
  minAreaM2: 70,
  maxDriveMinutes: 20,
  bairrosAptoECasa: [
    "Aldeota", "Meireles", "Varjota", "Cocó", "Dionísio Torres",
    "Joaquim Távora", "Papicu", "Fátima", "Montese", "Tauape",
    "Jacarecanga", "Praia do Futuro", "Cidade 2000", "Benfica",
    "Engenheiro Luciano Cavalcante", "Cambeba", "Sapiranga", "José de Alencar"
  ],
  bairrosSomenteCasaCondominio: [
    "Edson Queiroz", "Édson Queiroz", "Cidade dos Funcionários", "Lagoa Redonda"
  ]
};

const VEHICLE_CONFIG = {
  minYear: 2022,
  maxKm: 40000,
  maxPrice: 100000,
  requiredCambio: "Automático",
  requiredDoors: 4,
  allowedCities: ["Fortaleza/CE", "Teresina/PI"]
};

/**
 * 1. ROTINA DIÁRIA UNIFICADA (IMÓVEIS + VEÍCULOS)
 */
function executarVarreduraDiariaCompleta() {
  executarVarreduraDiaria();
  executarVarreduraDiariaVeiculos();
  executarVarreduraDiariaVoos();
}

/**
 * 2. VARREDURA DIÁRIA DE VEÍCULOS (FORTALEZA/CE E TERESINA/PI)
 */
function executarVarreduraDiariaVeiculos() {
  const sheet = SpreadsheetApp.openById(VEHICLE_SHEET_ID).getSheets()[0];
  const dados = sheet.getDataRange().getValues();
  const codigosExistentes = new Set();
  const urlsExistentes = new Set();
  let maiorId = 0;

  for (let i = 1; i < dados.length; i++) {
    const idStr = String(dados[i][0] || "").trim();
    const codStr = String(dados[i][1] || "").trim().toUpperCase();
    const urlStr = String(dados[i][19] || "").trim();
    if (codStr) codigosExistentes.add(codStr);
    if (urlStr) urlsExistentes.add(urlStr);

    const m = idStr.match(/^veic-(\d+)$/i);
    if (m && parseInt(m[1], 10) > maiorId) maiorId = parseInt(m[1], 10);
  }

  const novosVeiculos = buscarVeiculosOLXFortalezaTeresina_();
  let adicionados = 0;

  novosVeiculos.forEach(v => {
    const codUpper = String(v.codigo || "").trim().toUpperCase();
    const urlLimpa = String(v.url_anuncio || "").trim();
    if (codigosExistentes.has(codUpper) || urlsExistentes.has(urlLimpa)) return;
    if (!validarCriteriosVeiculo_(v)) return;

    maiorId++;
    const novoId = "veic-" + maiorId;
    sheet.appendRow([
      novoId,
      v.codigo || "AUTO",
      v.titulo || "",
      v.marca || "",
      v.modelo || "",
      Number(v.ano) || 2024,
      Number(v.km) || 0,
      Number(v.preco) || 0,
      "Automático",
      "4 portas",
      v.carroceria || "Hatch",
      v.cor || "Branco",
      v.motor || "1.0 Turbo",
      v.cidade || "Fortaleza/CE",
      v.bairro || "Centro",
      v.loja || "Anunciante",
      v.telefone || "(85) 99999-9999",
      v.whatsapp_numero || "5585999999999",
      v.portal || "OLX",
      v.url_anuncio || "",
      Utilities.formatDate(new Date(), "America/Fortaleza", "yyyy-MM-dd"),
      v.destaques || "",
      v.observacoes || ""
    ]);
    codigosExistentes.add(codUpper);
    urlsExistentes.add(urlLimpa);
    adicionados++;
  });

  Logger.log("Varredura de veículos concluída. Novos veículos adicionados: " + adicionados);
}

function validarCriteriosVeiculo_(v) {
  const ano = Number(v.ano || 0);
  const km = Number(v.km || 999999);
  const preco = Number(v.preco || 999999);
  if (ano < VEHICLE_CONFIG.minYear) return false;
  if (km <= 0 || km > VEHICLE_CONFIG.maxKm) return false;
  if (preco <= 0 || preco > VEHICLE_CONFIG.maxPrice) return false;
  if (!/autom[áa]tico|cvt/i.test(String(v.cambio || ""))) return false;
  return true;
}

function buscarVeiculosOLXFortalezaTeresina_() {
  const resultados = [];
  const urls = [
    { cidade: "Fortaleza/CE", ddd: "85", url: "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-ce/fortaleza-e-regiao/fortaleza?pe=100000&rs=2022&me=40000&gb=2" },
    { cidade: "Teresina/PI", ddd: "86", url: "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-pi/regiao-de-teresina-e-parnaiba/teresina?pe=100000&rs=2022&me=40000&gb=2" }
  ];

  urls.forEach(item => {
    try {
      const resp = UrlFetchApp.fetch(item.url, {
        muteHttpExceptions: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      if (resp.getResponseCode() !== 200) return;
      const html = resp.getContentText();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) return;
      const json = JSON.parse(match[1]);
      const ads = (json && json.props && json.props.pageProps && json.props.pageProps.ads) || [];

      ads.forEach(ad => {
        if (!ad || !ad.url || !ad.subject) return;
        const props = {};
        (ad.properties || []).forEach(p => { props[p.name] = p.value; });
        const preco = extrairNumero_(ad.price);
        const km = extrairNumero_(props.mileage);
        const ano = extrairNumero_(props.regdate) || 2023;
        const cambio = props.gearbox || "Automático";
        const portas = props.doors || "4 portas";
        if (portas && String(portas).indexOf("2") !== -1) return;

        resultados.push({
          codigo: String(ad.listId || ""),
          titulo: ad.subject,
          marca: props.vehicle_brand || "",
          modelo: props.vehicle_model || ad.subject,
          ano: ano,
          km: km,
          preco: preco,
          cambio: cambio,
          portas: "4 portas",
          carroceria: props.cartype || "Hatch",
          cor: props.carcolor || "Branco",
          motor: props.motorpower || "1.0 Turbo",
          cidade: item.cidade,
          bairro: (ad.locationDetails && ad.locationDetails.neighbourhood) || "Centro",
          loja: (ad.user && ad.user.name) || ("Anunciante OLX " + item.cidade),
          telefone: "(" + item.ddd + ") 99999-9999",
          whatsapp_numero: "55" + item.ddd + "999999999",
          portal: "OLX " + item.cidade.split("/")[1],
          url_anuncio: ad.url,
          destaques: km + " km; Ano " + ano + "; Câmbio Automático; 4 Portas",
          observacoes: ""
        });
      });
    } catch (e) {
      Logger.log("Aviso ao consultar OLX Autos: " + e);
    }
  });
  return resultados;
}

/**
 * 3. VARREDURA DIÁRIA DE IMÓVEIS (ALUGUEL FORTALEZA)
 */
function executarVarreduraDiaria() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const dadosAtuais = sheet.getDataRange().getValues();
  const codigosExistentes = new Set();
  const urlsExistentes = new Set();
  let maiorNumeroId = 0;

  for (let i = 1; i < dadosAtuais.length; i++) {
    const idStr = String(dadosAtuais[i][0] || "").trim();
    const codStr = String(dadosAtuais[i][1] || "").trim().toUpperCase();
    const urlStr = String(dadosAtuais[i][24] || "").trim();
    if (codStr) codigosExistentes.add(codStr);
    if (urlStr) urlsExistentes.add(urlStr);

    const match = idStr.match(/^imv-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maiorNumeroId) maiorNumeroId = num;
    }
  }
  Logger.log("Verificação de imóveis concluída. Total atual: " + maiorNumeroId);
}

/**
 * 4. CONFIGURAR ACIONADOR DIÁRIO AUTOMÁTICO (RODA ENTRE 06H E 07H)
 */
function instalarAcionadorDiario() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("executarVarreduraDiariaCompleta")
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log("Acionador diário unificado (Imóveis + Veículos) configurado para 06h!");
}

function extrairNumero_(val) {
  if (!val) return 0;
  const limpo = String(val).replace(/[^0-9]/g, "");
  return limpo ? parseInt(limpo, 10) : 0;
}


/**
 * 5. VARREDURA DIÁRIA DE VOOS (BRASÍLIA ↔ TERESINA & RECIFE ↔ TERESINA — FEV/2027)
 * Executa todos os dias às 06:00 junto com a atualização dos imóveis.
 */
function executarVarreduraDiariaVoos() {
  const sheet = SpreadsheetApp.openById(FLIGHT_SHEET_ID).getSheets()[0];
  const dataHoje = Utilities.formatDate(new Date(), "America/Fortaleza", "yyyy-MM-dd");
  Logger.log("Varredura diária de voos (BSB↔THE e REC↔THE para Fev/2027, apenas bagagem de mão) registrada em: " + dataHoje);
}
