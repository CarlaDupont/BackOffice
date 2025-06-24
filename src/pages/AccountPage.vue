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
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-sm">
        <q-btn label="Se déconnecter" color="negative" @click="logout" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script>
export default {
  name: 'MonComptePage',
  data() {
    return {
      user: {
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com'
      }
    };
  },
  methods: {
    logout() {
      this.$router.push({ name: 'login' });
    }
  }
};
</script>

<style scoped>
.bg-white {
  background-color: #ffffff;
}

.text-black {
  color: #000000;
}
</style>
