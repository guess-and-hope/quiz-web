export const environment = {
  production: false,
  // Klucz publishable jest z założenia publiczny (widoczny w kodzie frontendu).
  // Ochronę danych zapewnia Row Level Security po stronie Supabase, nie tajność klucza.
  supabaseUrl: 'https://mkhnifcsxonujmmxpktc.supabase.co',
  supabaseKey: 'sb_publishable_jNtQZpnNS7HslaG-k5az-Q_t_3xXPem',
};
