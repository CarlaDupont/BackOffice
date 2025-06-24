<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header>
      <q-toolbar>
        <q-toolbar-title>Back Office TravelMate</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Drawer (Menu Latéral) -->
    <q-drawer show-if-above>
      <q-list>
        <q-item clickable @click="goToDashboard">
          <q-item-section>Tableau de bord</q-item-section>
        </q-item>
        <q-item clickable @click="goToVoyages">
          <q-item-section>Gestion des voyages</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Contenu Principal -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  methods: {
    goToDashboard() {
      this.$router.push({ name: 'dashboard' });
    },
    goToVoyages() {
      this.$router.push({ name: 'voyages' });
    }
  }
}
</script>
