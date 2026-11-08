/* Radar 2.0 — autenticação compartilhada */
(() => {
  "use strict";
  const SUPABASE_URL = "https://kpvhfjthmkgiddfcsslw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_qqeTKGU8m_vbdV-IvPy4SQ_vh13JZ2d";
  if (!window.supabase?.createClient) {
    console.error("[Radar Auth] Biblioteca Supabase não carregada.");
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.RadarAuth = {
    client,
    getUser: async () => (await client.auth.getUser()).data.user || null
  };

  const css = document.createElement("style");
  css.textContent = `
    #radar-auth-launch{border:1px solid #475569;border-radius:999px;padding:8px 13px;background:#1e293b;color:#fff;font:700 12px Inter, sans-serif;cursor:pointer}
    #radar-auth-launch:hover{background:#334155}
    #radar-auth-layer{position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,.72);display:none;align-items:center;justify-content:center;padding:18px;font-family:Inter, sans-serif}
    #radar-auth-layer.open{display:flex}
    #radar-auth-card{width:min(100%,440px);background:#fff;color:#0f172a;border-radius:20px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.3)}
    #radar-auth-card input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:12px;margin:7px 0 12px;font:14px Inter,sans-serif}
    #radar-auth-card button{border:0;border-radius:10px;padding:11px 14px;font-weight:700;cursor:pointer}
    #radar-auth-submit,#radar-family-create{background:#0f172a;color:#fff;width:100%}
    #radar-auth-close{background:#e2e8f0;color:#334155}
    #radar-auth-status{font-size:13px;color:#475569;line-height:1.5;min-height:38px;margin:10px 0}
    #radar-auth-user{font-size:11px;color:#cbd5e1;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  `;
  document.head.appendChild(css);

  const layer = document.createElement("div");
  layer.id = "radar-auth-layer";
  layer.innerHTML = `
    <section id="radar-auth-card" role="dialog" aria-modal="true" aria-labelledby="radar-auth-title">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:.08em">RADAR 2.0</div>
        <h2 id="radar-auth-title" style="font-size:22px;font-weight:900;margin:4px 0">Acesso familiar</h2></div>
        <button id="radar-auth-close" type="button">Fechar</button>
      </div>
      <div id="radar-auth-signedout">
        <p style="font-size:13px;color:#475569;line-height:1.5">Entre com seu e-mail. Enviaremos um link seguro para confirmar seu acesso, sem precisar criar senha.</p>
        <label for="radar-auth-email" style="font-size:12px;font-weight:700">E-mail</label>
        <input id="radar-auth-email" type="email" autocomplete="email" placeholder="voce@exemplo.com">
        <button id="radar-auth-submit" type="button">Enviar link de acesso</button>
      </div>
      <div id="radar-auth-signedin" hidden>
        <p style="font-size:13px;color:#475569">Sessão autenticada:</p>
        <p id="radar-auth-email-label" style="font-size:14px;font-weight:800;overflow-wrap:anywhere"></p>
        <div id="radar-family-area">
          <label for="radar-family-name" style="font-size:12px;font-weight:700">Nome do espaço familiar</label>
          <input id="radar-family-name" type="text" maxlength="80" placeholder="Ex.: Família">
          <button id="radar-family-create" type="button">Criar espaço familiar</button>
        </div>
        <button id="radar-auth-signout" type="button" style="margin-top:12px;background:#fee2e2;color:#991b1b;width:100%">Sair da conta</button>
      </div>
      <p id="radar-auth-status" role="status" aria-live="polite"></p>
      <p style="font-size:11px;color:#94a3b8;line-height:1.45">As avaliações e observações pessoais usam uma estrutura privada por usuário. A sincronização depende da ativação da migração Radar 2.0 no Supabase; os registros antigos ainda não foram migrados.</p>
    </section>`;
  document.body.appendChild(layer);

  const launch = document.createElement("button");
  launch.id = "radar-auth-launch";
  launch.type = "button";
  launch.textContent = "Entrar";
  const header = document.querySelector("header .max-w-7xl > div") || document.querySelector("header .max-w-7xl");
  if (header) {
    const holder = document.createElement("div");
    holder.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap";
    holder.appendChild(launch);
    header.appendChild(holder);
  } else {
    launch.style.cssText = "position:fixed;top:12px;right:12px;z-index:1000";
    document.body.appendChild(launch);
  }

  const $ = id => document.getElementById(id);
  const setStatus = message => { $("radar-auth-status").textContent = message || ""; };
  const open = () => { layer.classList.add("open"); refresh(); };
  const close = () => layer.classList.remove("open");
  launch.addEventListener("click", open);
  $("radar-auth-close").addEventListener("click", close);
  layer.addEventListener("click", e => { if (e.target === layer) close(); });

  async function refresh() {
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    $("radar-auth-signedout").hidden = !!user;
    $("radar-auth-signedin").hidden = !user;
    launch.textContent = user ? "Minha conta" : "Entrar";
    let label = document.getElementById("radar-auth-user");
    if (user) {
      $("radar-auth-email-label").textContent = user.email || "Conta autenticada";
      if (!label && header) {
        label = document.createElement("span");
        label.id = "radar-auth-user";
        header.querySelector("div:last-child")?.appendChild(label);
      }
      if (label) label.textContent = user.email || "";
      const { data: memberships, error: memberError } = await client.from("family_members").select("family_id,role").limit(1);
      const familyArea = $("radar-family-area");
      if (memberError) {
        familyArea.hidden = false;
        setStatus("Não foi possível consultar o espaço familiar: " + memberError.message);
      } else if (memberships?.length) {
        familyArea.hidden = true;
        setStatus("Espaço familiar ativo. Suas avaliações e observações pessoais podem ser sincronizadas nesta versão.");
      } else {
        familyArea.hidden = false;
        setStatus("Sua conta está autenticada. Crie o espaço familiar para começar.");
      }
    } else {
      if (label) label.textContent = "";
      setStatus(error ? error.message : "Entre para configurar seu espaço familiar.");
    }
  }

  $("radar-auth-submit").addEventListener("click", async () => {
    const email = $("radar-auth-email").value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("Informe um e-mail válido.");
      return;
    }
    const button = $("radar-auth-submit");
    button.disabled = true;
    button.textContent = "Enviando...";
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href }
    });
    button.disabled = false;
    button.textContent = "Enviar link de acesso";
    setStatus(error ? "Não foi possível enviar o link: " + error.message : "Link enviado! Confira sua caixa de entrada e também a pasta de spam.");
  });

  $("radar-family-create").addEventListener("click", async () => {
    const name = $("radar-family-name").value.trim();
    if (!name) { setStatus("Digite um nome para o espaço familiar."); return; }
    const button = $("radar-family-create");
    button.disabled = true;
    button.textContent = "Criando...";
    const { data, error } = await client.rpc("create_family_space", { p_name: name });
    button.disabled = false;
    button.textContent = "Criar espaço familiar";
    if (error) setStatus("Não foi possível criar o espaço: " + error.message);
    else {
      setStatus("Espaço familiar criado com sucesso.");
      await refresh();
    }
  });

  $("radar-auth-signout").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    setStatus(error ? "Erro ao sair: " + error.message : "Você saiu da conta.");
    await refresh();
  });

  client.auth.onAuthStateChange(() => {
    // Evita chamadas Supabase aninhadas dentro do callback de auth (lock interno).
    queueMicrotask(async () => {
      await window.RadarAuth.preferences?.clearContext?.();
      await refresh();
      window.dispatchEvent(new CustomEvent("radar:auth-changed"));
    });
  });
  refresh();
})();