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
        <p style="font-size:13px;color:#475569;line-height:1.5">Acesse com seu e-mail e senha. No primeiro cadastro, pode ser necessário confirmar seu endereço de e-mail uma única vez.</p>
        <div style="display:flex;gap:8px;margin:12px 0">
          <button id="radar-auth-mode-login" type="button" style="flex:1;background:#0f172a;color:#fff">Entrar</button>
          <button id="radar-auth-mode-signup" type="button" style="flex:1;background:#e2e8f0;color:#334155">Criar conta</button>
        </div>
        <label for="radar-auth-email" style="font-size:12px;font-weight:700">E-mail</label>
        <input id="radar-auth-email" type="email" autocomplete="email" placeholder="voce@exemplo.com">
        <label for="radar-auth-password" style="font-size:12px;font-weight:700">Senha</label>
        <input id="radar-auth-password" type="password" autocomplete="current-password" placeholder="Mínimo de 8 caracteres">
        <div id="radar-auth-password-confirm-wrap" hidden>
          <label for="radar-auth-password-confirm" style="font-size:12px;font-weight:700">Confirmar senha</label>
          <input id="radar-auth-password-confirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente">
        </div>
        <button id="radar-auth-submit" type="button">Entrar</button>
        <button id="radar-auth-forgot" type="button" style="background:transparent;color:#475569;width:100%;margin-top:6px;font-size:12px">Esqueci minha senha</button>
      </div>
      <div id="radar-auth-signedin" hidden>
        <p style="font-size:13px;color:#475569">Sessão autenticada:</p>
        <p id="radar-auth-email-label" style="font-size:14px;font-weight:800;overflow-wrap:anywhere"></p>
        <div id="radar-auth-password-change" style="margin:12px 0;padding:12px;border:1px solid #e2e8f0;border-radius:12px">
          <label for="radar-auth-new-password" style="font-size:12px;font-weight:700">Definir ou alterar senha</label>
          <input id="radar-auth-new-password" type="password" autocomplete="new-password" placeholder="Nova senha (mínimo 8 caracteres)">
          <button id="radar-auth-password-save" type="button" style="background:#e2e8f0;color:#0f172a;width:100%">Salvar senha</button>
        </div>
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

  let authMode = "login";
  function setAuthMode(mode) {
    authMode = mode;
    $("radar-auth-mode-login").style.background = mode === "login" ? "#0f172a" : "#e2e8f0";
    $("radar-auth-mode-login").style.color = mode === "login" ? "#fff" : "#334155";
    $("radar-auth-mode-signup").style.background = mode === "signup" ? "#0f172a" : "#e2e8f0";
    $("radar-auth-mode-signup").style.color = mode === "signup" ? "#fff" : "#334155";
    $("radar-auth-password-confirm-wrap").hidden = mode !== "signup";
    $("radar-auth-submit").textContent = mode === "signup" ? "Criar conta" : "Entrar";
    $("radar-auth-password").autocomplete = mode === "signup" ? "new-password" : "current-password";
    setStatus("");
  }
  $("radar-auth-mode-login").addEventListener("click", () => setAuthMode("login"));
  $("radar-auth-mode-signup").addEventListener("click", () => setAuthMode("signup"));

  $("radar-auth-submit").addEventListener("click", async () => {
    const email = $("radar-auth-email").value.trim();
    const password = $("radar-auth-password").value;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("Informe um e-mail válido."); return; }
    if (password.length < 8) { setStatus("A senha deve ter pelo menos 8 caracteres."); return; }
    if (authMode === "signup" && password !== $("radar-auth-password-confirm").value) { setStatus("As senhas não conferem."); return; }
    const button = $("radar-auth-submit");
    button.disabled = true; button.textContent = authMode === "signup" ? "Criando conta..." : "Entrando...";
    let error = null;
    if (authMode === "signup") {
      const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } });
      error = result.error;
      if (!error && !result.data.session) setStatus("Cadastro iniciado. Confirme seu e-mail uma única vez; depois, entre normalmente com sua senha.");
      else if (!error) { setStatus("Conta criada e sessão iniciada."); await refresh(); }
    } else {
      const result = await client.auth.signInWithPassword({ email, password });
      error = result.error;
      if (!error) { setStatus("Login realizado."); await refresh(); }
    }
    button.disabled = false; button.textContent = authMode === "signup" ? "Criar conta" : "Entrar";
    if (error) setStatus(authMode === "signup" ? "Não foi possível criar a conta: " + error.message : "Não foi possível entrar: " + error.message);
  });

  $("radar-auth-forgot").addEventListener("click", async () => {
    const email = $("radar-auth-email").value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("Informe seu e-mail para receber o link de redefinição."); return; }
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    setStatus(error ? "Não foi possível enviar a redefinição: " + error.message : "Enviamos um link para redefinir sua senha. Use-o apenas para criar uma nova senha.");
  });

  $("radar-auth-password-save").addEventListener("click", async () => {
    const password = $("radar-auth-new-password").value;
    if (password.length < 8) { setStatus("A senha deve ter pelo menos 8 caracteres."); return; }
    const button = $("radar-auth-password-save"); button.disabled = true; button.textContent = "Salvando...";
    const { error } = await client.auth.updateUser({ password });
    button.disabled = false; button.textContent = "Salvar senha";
    setStatus(error ? "Não foi possível salvar a senha: " + error.message : "Senha definida com sucesso. Nas próximas entradas, use e-mail e senha.");
    if (!error) $("radar-auth-new-password").value = "";
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