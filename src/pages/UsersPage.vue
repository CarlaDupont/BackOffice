<template>
  <q-page>
    <q-card>
      <q-card-section>
        <div class="text-h6">Gestion des Utilisateurs</div>
        <q-btn label="Ajouter un Utilisateur" color="primary" @click="openAddUserDialog" />
        <q-separator />
        <q-table :rows="utilisateurs" :columns="columns" />
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen">
      <q-card>
        <q-card-section>
          <div class="text-h6">Ajouter un Utilisateur</div>
          <q-input v-model="newUser.username" label="Nom d'utilisateur" />
          <q-input v-model="newUser.firstName" label="Prénom" />
          <q-input v-model="newUser.lastName" label="Nom" />
          <q-input v-model="newUser.email" label="Email" />
        </q-card-section>
        <q-card-actions>
          <q-btn label="Annuler" color="negative" @click="dialogOpen = false" />
          <q-btn label="Ajouter" color="positive" @click="addUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
export default {
  name: 'UsersPage',
  data() {
    return {
      utilisateurs: [
        { username: 'cDup', firstName: 'Carla', lastName: 'Dupont', email: 'carladupont@example.com' }
      ],
      columns: [
        { name: 'username', label: 'Nom d\'utilisateur', align: 'left', field: row => row.username },
        { name: 'firstName', label: 'Prénom', align: 'center', field: row => row.firstName },
        { name: 'lastName', label: 'Nom', align: 'center', field: row => row.lastName },
        { name: 'email', label: 'Email', align: 'left', field: row => row.email }
      ],
      dialogOpen: false,
      newUser: {
        username: '',
        firstName: '',
        lastName: '',
        email: ''
      }
    }
  },
  methods: {
    openAddUserDialog() {
      this.dialogOpen = true;
    },
    addUser() {
      this.utilisateurs.push({ ...this.newUser });
      this.dialogOpen = false;
      this.newUser = { username: '', firstName: '', lastName: '', email: '' }; // Reset form
    }
  }
}
</script>
