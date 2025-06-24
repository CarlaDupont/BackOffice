import { createApp } from 'vue'
import App from './App.vue'
import { Quasar } from 'quasar'
import router from './router'
import quasarUserOptions from './quasar-user-options'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://etzdkvwucgaznmolqdyj.supabase.co'
const supabaseKey = 'eyJh...AD9D6LwM'
const supabase = createClient(supabaseUrl, supabaseKey)

const app = createApp(App)

app.config.globalProperties.$supabase = supabase
app.use(Quasar, quasarUserOptions)
app.use(router)

app.mount('#q-app')
