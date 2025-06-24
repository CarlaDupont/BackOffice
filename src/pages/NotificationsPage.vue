<template>
  <q-page padding class="notifications-page">
    <div class="page-header">
      <h1>Notifications</h1>
    </div>

    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Erreurs Système</div>
        <div class="stat-value">{{ systemErrors }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Nouveaux Messages</div>
        <div class="stat-value">{{ newMessages }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Nouveaux Commentaires</div>
        <div class="stat-value">{{ newComments }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Alertes</div>
        <div class="stat-value">{{ newAlerts }}</div>
      </div>
    </div>

    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Mises à Jour Récentes</div>
        <div class="stat-value">{{ recentUpdates }}</div>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'NotificationsPage',
  data() {
    return {
      systemErrors: 2,
      newMessages: 5,
      newComments: 10,
      newAlerts: 3,
      recentUpdates: 7
    };
  }
};
</script>

<style scoped>
.notifications-page {
  background: #f9fafa;
  min-height: 100%;
}

.page-header h1 {
  margin: 0 0 24px;
  font-size: 24px;
  color: #333;
}

.cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  color: #222;
}
</style>
