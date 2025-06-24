// src/boot/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export default ({ app, store }) => {
  // injection globale
  app.config.globalProperties.$supabase = supabase

  // on installe un listener pour mettre à jour le store à chaque changement d’état
  supabase.auth.onAuthStateChange((event, session) => {
    store.commit('auth/SET_SESSION', session)
  })
}
