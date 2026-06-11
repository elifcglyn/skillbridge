import { createClient } from '@supabase/supabase-js'

// Vite projelerinde .env dosyalarındaki veriler import.meta.env ile çekilir
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Eğer .env.local dosyası yoksa veya içi boşsa geliştiriciyi uyar
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL veya Anon Key bulunamadı! Lütfen .env.local dosyasını kontrol edin.")
}

// Supabase istemcisini oluştur ve dışa aktar
export const supabase = createClient(supabaseUrl, supabaseAnonKey)