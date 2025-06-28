<template>
  <q-layout view="hHh Lpr fFf">

    <q-drawer
      v-if="showDrawer"
      v-model="drawerOpen"
      show-if-above
      :breakpoint="700"
      width="220"
      bordered
      class="bg-dark text-white"
    >
      <div class="drawer-header">
        <span>Travel Mate</span>
        <q-btn
          v-if="isMobile"
          dense
          round
          flat
          icon="close"
          @click="drawerOpen = false"
          class="text-white"
          size="sm"
        />
      </div>

      <q-list padding>
        <q-item to="/" exact active-class="active-link">
          <q-item-section>Dashboard</q-item-section>
        </q-item>
        <q-item to="/favorites" active-class="active-link">
          <q-item-section>Favoris</q-item-section>
        </q-item>
        <q-item to="/destinations" active-class="active-link">
          <q-item-section>Destinations</q-item-section>
        </q-item>
        <q-item to="/reservations" active-class="active-link">
          <q-item-section>Réservations</q-item-section>
        </q-item>
        <q-item to="/notifications" active-class="active-link">
          <q-item-section>Notifications</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-header
      elevated
      class="header-bar"
      :style="{
        width: showDrawer && !isMobile ? 'calc(100% - 220px)' : '100%',
        left:  showDrawer && !isMobile ? '220px'            : '0'
      }"
    >
      <q-toolbar>
        <q-btn
          v-if="isMobile"
          dense
          round
          unelevated
          :icon="drawerOpen ? 'close' : 'menu'"
          @click="drawerOpen = !drawerOpen"
          class="q-mr-sm bg-dark text-white"
        />
        <q-space />
        <q-btn
          flat
          dense
          round
          icon="person"
          @click="$router.push({ name: 'account' })"
          class="bg-dark text-white"
        />
      </q-toolbar>
    </q-header>

    <q-page-container
      class="bg-grey-1"
      :style="showDrawer && !isMobile
        ? { 'margin-left': '220px', 'margin-top': '64px' }
        : { margin: '64px 0 0 0' }
      "
    >
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawerOpen: this.$q.screen.gt.sm
    };
  },
  computed: {
    isMobile() {
      return this.$q.screen.lt.md;
    },
    showDrawer() {
      return this.$route.name !== 'login';
    }
  },
  watch: {
    '$q.screen.gt.sm'(isGtSm) {
      if (this.showDrawer) this.drawerOpen = isGtSm;
    },
    showDrawer(visible) {
      if (visible && this.$q.screen.gt.sm) this.drawerOpen = true;
    }
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

html, body, #q-app {
  margin: 0;
  font-family: 'Poppins', sans-serif;
}

.bg-dark {
  background-color: #34495e !important;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 12px;
  font-weight: 600;
  font-size: 18px;
  border-bottom: 1px solid rgba(236,240,241,0.15);
}
.q-drawer--left {
  top: 0 !important;
  height: 100vh !important;
}

.header-bar {
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  z-index: 10;
  height: 64px;
}

.q-page-container {
  padding: 0 !important;
}

@media (max-width: 700px) {
  .q-layout__drawer { display: none !important; }
  .q-layout__container,
  .q-page-container {
    padding-left: 0 !important;
    margin: 64px 0 0 0 !important;
  }
  .header-bar {
    width: 100% !important;
    left: 0 !important;
  }
}
</style>
