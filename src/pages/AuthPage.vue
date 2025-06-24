<template>
  <q-page padding class="flex flex-center">
    <q-card class="auth-card bg-white text-black">
      <q-card-section>
        <div class="text-h5 q-mb-md">
          {{ isLogin ? 'Connexion' : 'Inscription' }}
        </div>

        <q-form @submit.prevent="onSubmit" ref="authForm">
          <q-input
            v-model="credentials.email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'L’email est requis']"
            class="q-mb-sm"
          />

          <q-input
            v-model="credentials.password"
            label="Mot de passe"
            type="password"
            outlined
            dense
            :rules="[val => !!val || 'Le mot de passe est requis']"
            class="q-mb-sm"
          />

          <div v-if="errorMessage" class="text-negative q-mb-sm">
            {{ errorMessage }}
          </div>

          <q-card-actions align="right">
            <q-btn
              flat
              color="secondary"
              @click="toggleMode"
              :label="isLogin ? 'Créer un compte' : 'Déjà inscrit ? Se connecter'"
            />
            <q-btn
              :label="isLogin ? 'Se connecter' : 'S’inscrire'"
              color="primary"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { markAsAuthenticated } from '../router'
import { supabase } from '../boot/supabase'

export default {
  name: 'AuthPage',
  data() {
    return {
      isLogin: true,
      credentials: {
        email: '',
        password: ''
      },
      errorMessage: ''
    }
  },
  methods: {
    async onSubmit() {
      this.errorMessage = ''
      const email = this.credentials.email.trim().toLowerCase()
      const password = this.credentials.password

      if (!email || !password) {
        this.errorMessage = 'Veuillez remplir tous les champs.'
        return
      }

      try {
        let authResponse

        if (this.isLogin) {
          authResponse = await supabase.auth.signInWithPassword({ email, password })
        } else {
          authResponse = await supabase.auth.signUp({ email, password })
        }

        if (authResponse.error) {
          this.errorMessage = authResponse.error.message
          return
        }

        const user = authResponse.data.user
        const session = authResponse.data.session

        if (!this.isLogin && user) {
          // 👤 Inscription : créer l'entrée dans la table "user"
          const { error } = await supabase.from('user').insert({
            id_auth: user.id,
            email: user.email,
            first_name: '',
            last_name: '',
            role: 'User' // rôle par défaut si non spécifié
          })

          if (error) {
            this.errorMessage = 'Erreur lors de la création de l’utilisateur.'
            return
          }

          this.errorMessage = 'Inscription réussie ! Vérifiez votre e-mail avant de vous connecter.'
          this.isLogin = true
          return
        }

        if (this.isLogin && session) {
          // 🔄 Requête pour récupérer le rôle dans la table "user"
          const { data: userData, error: userError } = await supabase
            .from('user')
            .select('role')
            .eq('id_auth', user.id)
            .single()

          if (userError) {
            this.errorMessage = "Impossible de récupérer le rôle de l'utilisateur."
            return
          }

          const userRole = userData.role

          // 💾 Stockage local du rôle (optionnel)
          localStorage.setItem('userRole', userRole)

          // 🔐 Redirection selon le rôle autorisé
          if (['Owner', 'SAdmin', 'Admin'].includes(userRole)) {
            markAsAuthenticated()
            this.$router.push({ name: 'dashboard' })
          } else {
            this.errorMessage = "Accès refusé. Ce compte n'a pas les droits nécessaires."
          }
        }
      } catch (err) {
        this.errorMessage = 'Une erreur est survenue.'
        console.error(err)
      }
    },

    toggleMode() {
      this.isLogin = !this.isLogin
      this.resetForm()
    },

    resetForm() {
      this.credentials.email = ''
      this.credentials.password = ''
      this.errorMessage = ''
      this.$refs.authForm.resetValidation()
    }
  }
}
</script>

<style scoped>
.auth-card {
  width: 380px;
  max-width: 90%;
  margin-top: 100px;
}

.bg-white {
  background-color: #fff;
}

.text-black {
  color: #000;
}

.text-h5 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
}

.q-mb-md {
  margin-bottom: 16px;
}

.q-mb-sm {
  margin-bottom: 8px;
}
</style>
