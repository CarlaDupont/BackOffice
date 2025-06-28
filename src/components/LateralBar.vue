<template>
  <q-drawer
    v-model="open"
    show-if-above
    width="220"
    bordered
    header-inset="false"
    style="background-color: #34495e; color: #ecf0f1;"
    class="lateral-bar"
  >
    <div class="bar-header">
      <div class="app-title">Travel Mate</div>
    </div>

    <q-list padding>
      <q-item to="/" exact active-class="active-link">
        <q-item-section>Dashboard</q-item-section>
      </q-item>
      <q-item to="/favorites" active-class="active-link">
        <q-item-section>Statistiques</q-item-section>
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
</template>

<script>
export default {
  name: 'LateralBar',
  data() {
    return {
      open: true
    };
  }
};
</script>

<style scoped>
.lateral-bar {
  top: 0 !important;
  height: 100vh;
  box-shadow: 2px 0 8px rgba(0,0,0,0.2);
}

.bar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(236,240,241,0.15);
}

.app-title {
  font-size: 18px;
  font-weight: 600;
}

.q-item {
  color: #ecf0f1;
}

.q-item:hover {
  background: rgba(236,240,241,0.1);
}

.active-link {
  background: rgba(236,240,241,0.2) !important;
}
</style>
