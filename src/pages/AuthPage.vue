<template>
  <q-page padding class="flex flex-center">
    <q-card class="auth-card bg-white text-black">
      <q-card-section>
        <div class="text-h5 q-mb-md">Connexion</div>
        <q-form @submit.prevent="onSubmit" ref="loginForm">
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
            <q-btn label="Annuler" flat color="secondary" @click="resetForm" />
            <q-btn label="Se connecter" color="primary" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { supabase } from 'boot/supabase'           // votre boot file
import { markAsAuthenticated } from 'src/router/index.js'  // ajustez si besoin le chemin

export default {
  name: 'AuthPage',
  data() {
    return {
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

      const { error } = await supabase.auth.signInWithPassword({
        email: this.credentials.email,
        password: this.credentials.password
      })

      if (error) {
        this.errorMessage = error.message
        return
      }

      // login réussi
      markAsAuthenticated()
      this.$router.push({ name: 'dashboard' })
    },

    resetForm() {
      this.credentials.email = ''
      this.credentials.password = ''
      this.errorMessage = ''
      this.$refs.loginForm.resetValidation()
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
