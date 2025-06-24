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
import { markAsAuthenticated } from '../router' // 👈 Assure-toi que ce chemin est correct

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
        let response

        if (this.isLogin) {
          console.log("Tentative de connexion", email)
          response = await this.$supabase.auth.signInWithPassword({ email, password })
        } else {
          console.log("Tentative d'inscription", email)
          response = await this.$supabase.auth.signUp({ email, password })
        }

        if (response.error) {
          this.errorMessage = response.error.message
          return
        }

        if (this.isLogin && response.data?.session) {
          markAsAuthenticated() // ✅ permet au router d'autoriser l'accès
          this.$router.push({ name: 'dashboard' })
        } else if (!this.isLogin) {
          this.errorMessage = 'Inscription réussie ! Vérifiez votre e-mail avant de vous connecter.'
          this.isLogin = true
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

.bg-white { background-color: #fff; }
.text-black { color: #000; }

.text-h5 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
}

.q-mb-md { margin-bottom: 16px; }
.q-mb-sm { margin-bottom: 8px; }
</style>
