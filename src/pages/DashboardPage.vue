<template>
  <q-page padding class="dashboard-page">
    <div class="dashboard-header"><h1>Dashboard</h1></div>
    <div class="notifications-row">
      <div class="notif-card notif-important">
        <div class="notif-title">Importante</div>
        <div class="notif-count">{{ importantCount }}</div>
      </div>
      <div class="notif-card notif-moderate">
        <div class="notif-title">Modérée</div>
        <div class="notif-count">{{ moderateCount }}</div>
      </div>
      <div class="notif-card notif-innocuous">
        <div class="notif-title">Inoffensive</div>
        <div class="notif-count">{{ innocuousCount }}</div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Réservations cette semaine</div>
        <div class="stat-value">{{ reservationsThisWeek }}</div>
        <div class="stat-sub">Aujourd'hui {{ reservationsToday }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Retour client</div>
        <div class="stat-value">{{ systemFailures }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total des Voyages</div>
        <div class="stat-row">
          <div><strong>Plage</strong><br>{{ totalTrips.beach }}</div>
          <div><strong>Hiver</strong><br>{{ totalTrips.winter }}</div>
          <div><strong>Ville</strong><br>{{ totalTrips.city }}</div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition des destinations</div>
          <q-chart :options="destOptions" :series="destSeries" type="donut" height="200" />
        </q-card-section>
      </q-card>

      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Tendances des réservations</div>
          <q-chart :options="trendOptions" :series="trendSeries" type="line" height="200" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'DashboardPage',
  data() {
    return {
      importantCount: 5,
      moderateCount: 12,
      innocuousCount: 23,
      reservationsThisWeek: 1267,
      reservationsToday: 103,
      systemFailures: 3,
      totalTrips: { beach: 32, winter: 54, city: 26 },
      destOptions: {
        labels: ['Plage','Hiver','Ville'],
        colors: ['#A8E6CF','#FFD3B6','#FF8B94'],
        legend: { position: 'bottom' }
      },
      destSeries: [32,54,26],
      trendOptions: {
        chart: { toolbar: { show: false } },
        xaxis: { categories: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] },
        stroke: { curve: 'smooth' }
      },
      trendSeries: [{ name:'Réservations', data:[15,22,30,45,38,50,60] }]
    };
  }
};
</script>

<style scoped>
.dashboard-page {
  background: #f9fafa;
  min-height: 100%;
}

/* Header */
.dashboard-header h1 {
  margin: 0 0 24px;
  font-size: 24px;
  color: #333;
}

.notifications-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.notif-card {
  flex: 1;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  text-align: center;
}
.notif-title {
  font-size: 14px; color: #555; margin-bottom: 8px;
}
.notif-count {
  font-size: 20px; font-weight:600; color:#222;
}
.notif-important { background:#FFCDD2; }
.notif-moderate  { background:#FFE0B2; }
.notif-innocuous { background:#C8E6C9; }

.cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  flex: 1; background:#fff; border-radius:8px;
  padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.05);
}
.stat-title { font-size:14px; color:#666; margin-bottom:8px; }
.stat-value { font-size:28px; color:#222; margin-bottom:4px; }
.stat-sub   { font-size:12px; color:#999; }
.stat-row   { display:flex; justify-content:space-between; font-size:14px; color:#555; }

.charts-row { display:flex; gap:16px; }
.chart-card {
  flex:1; background:#fff; border-radius:8px;
  box-shadow:0 2px 6px rgba(0,0,0,0.05);
}
.chart-title { font-size:16px; color:#333; margin-bottom:12px; }
</style>
