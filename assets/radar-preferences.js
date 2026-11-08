/* Radar 2.0 — preferências privadas por usuário e espaço familiar. */
(() => {
  "use strict";
  const auth = window.RadarAuth;
  if (!auth?.client) return;
  const client = auth.client;
  let contextPromise = null;
  async function getContext(force = false) {
    if (!force && contextPromise) return contextPromise;
    contextPromise = (async () => {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      const user = userData?.user;
      if (!user) return null;
      const { data: memberships, error } = await client
        .from("family_members").select("family_id,role").limit(2);
      if (error) throw error;
      if (!memberships?.length) return { user, familyId: null, role: null };
      if (memberships.length > 1) throw new Error("Esta conta participa de mais de um espaço familiar. Selecione o espaço antes de sincronizar.");
      return { user, familyId: memberships[0].family_id, role: memberships[0].role };
    })();
    try { return await contextPromise; }
    catch (error) { contextPromise = null; throw error; }
  }
  async function load(domain) {
    const context = await getContext();
    if (!context) return { authenticated: false, familyId: null, preferences: {} };
    if (!context.familyId) return { authenticated: true, familyId: null, preferences: {} };
    const { data, error } = await client.from("user_listing_preferences")
      .select("listing_id,rating,is_favorite,notes,updated_at")
      .eq("family_id", context.familyId)
      .eq("user_id", context.user.id)
      .eq("domain", domain);
    if (error) throw error;
    const preferences = {};
    (data || []).forEach(row => { preferences[row.listing_id] = row; });
    return { authenticated: true, familyId: context.familyId, preferences };
  }
  async function save(domain, listingId, patch) {
    const context = await getContext();
    if (!context?.user) throw new Error("Entre na sua conta para salvar preferências.");
    if (!context.familyId) throw new Error("Crie ou entre em um espaço familiar antes de salvar.");
    const safePatch = {};
    if (Object.prototype.hasOwnProperty.call(patch, "rating")) {
      const rating = patch.rating;
      if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error("A avaliação deve ser de 1 a 5 estrelas ou nula.");
      safePatch.rating = rating;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "is_favorite")) safePatch.is_favorite = !!patch.is_favorite;
    if (Object.prototype.hasOwnProperty.call(patch, "notes")) {
      const notes = String(patch.notes ?? "");
      if (notes.length > 10000) throw new Error("A observação ultrapassa 10.000 caracteres.");
      safePatch.notes = notes;
    }
    const keys = ["family_id", "user_id", "domain", "listing_id"];
    const identity = {
      family_id: context.familyId,
      user_id: context.user.id,
      domain,
      listing_id: String(listingId)
    };
    // Preserve fields not included in this partial update.
    const { data: existing, error: readError } = await client.from("user_listing_preferences")
      .select("rating,is_favorite,notes")
      .match(identity)
      .maybeSingle();
    if (readError) throw readError;
    const payload = {
      ...identity,
      rating: existing?.rating ?? null,
      is_favorite: existing?.is_favorite ?? false,
      notes: existing?.notes ?? "",
      ...safePatch
    };
    const { error } = await client.from("user_listing_preferences")
      .upsert(payload, { onConflict: keys.join(",") });
    if (error) throw error;
    return true;
  }
  async function clearContext() { contextPromise = null; }
  auth.preferences = { getContext, load, save, clearContext };
})();