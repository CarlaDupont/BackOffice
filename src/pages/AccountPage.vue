<template>
  <q-page padding class="column items-center">
    <q-card class="bg-white text-black" style="max-width: 400px; width: 100%;">
      <q-card-section class="row items-center q-pa-md">
        <q-avatar size="80px" class="q-mr-md">
          <img src="https://via.placeholder.com/80" alt="Avatar utilisateur" />
        </q-avatar>
        <div>
          <div class="text-h6">{{ user.firstName }} {{ user.lastName }}</div>
          <div class="text-caption">{{ user.username }}</div>
          <div class="text-caption">{{ user.email }}</div>
          <div class="text-caption text-bold">Rôle : {{ user.role }}</div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-sm">
        <q-btn label="Se déconnecter" color="negative" @click="logout" />
        <q-btn
          v-if="['Owner', 'SAdmin'].includes(user.role)"
          label="Créer un compte"
          color="primary"
          @click="showCreateDialog = true"
        />
      </q-card-actions>
    </q-card>

    <!-- Dialog création de compte -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="bg-white text-black" style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Créer un nouveau compte</div>
        </q-card-section>

        <q-form @submit.prevent="handleCreateAccount">
          <q-card-section class="q-pt-none">
            <q-input v-model="newUser.email" label="Email" type="email" required outlined class="q-mb-sm" />
            <q-input v-model="newUser.password" label="Mot de passe" type="password" required outlined class="q-mb-sm" />
            <q-select
              v-model="newUser.role"
              label="Rôle"
              :options="availableRoles"
              outlined
              required
            />
            <div v-if="errorMessage" class="text-negative q-mt-sm">{{ errorMessage }}</div>
            <div v-if="successMessage" class="text-positive q-mt-sm">{{ successMessage }}</div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Annuler" v-close-popup />
            <q-btn label="Créer" type="submit" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { supabase } from '../boot/supabase'

export default {
  name: 'MonComptePage',
  data() {
    return {
      user: {
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        role: localStorage.getItem('userRole') || 'User'
      },
      showCreateDialog: false,
      newUser: {
        email: '',
        password: '',
        role: ''
      },
      errorMessage: '',
      successMessage: ''
    }
  },
  computed: {
    availableRoles() {
      if (this.user.role === 'Owner') return ['Admin', 'SAdmin']
      if (this.user.role === 'SAdmin') return ['Admin']
      return []
    }
  },
  methods: {
    logout() {
      localStorage.clear()
      this.$router.push({ name: 'login' })
    },
    async handleCreateAccount() {
      this.errorMessage = ''
      this.successMessage = ''

      const { email, password, role } = this.newUser

      if (!email || !password || !role) {
        this.errorMessage = 'Veuillez remplir tous les champs.'
        return
      }

      try {
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) {
          this.errorMessage = error.message
          return
        }

        const userId = data.user?.id
        if (!userId) {
          this.errorMessage = "L'utilisateur n'a pas été créé correctement."
          return
        }

        const { error: insertError } = await supabase.from('user').insert({
          id_auth: userId,
          email,
          role,
          first_name: '',
          last_name: ''
        })

        if (insertError) {
          this.errorMessage = 'Erreur lors de la création en base de données.'
          return
        }

        this.successMessage = 'Compte créé avec succès !'
        this.newUser = { email: '', password: '', role: '' }
      } catch (err) {
        this.errorMessage = 'Une erreur est survenue.'
        console.error(err)
      }
    }
  }
}
</script>

<style scoped>
.bg-white {
  background-color: #ffffff;
}
.text-black {
  color: #000000;
}
</style>
