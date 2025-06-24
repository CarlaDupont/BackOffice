<template>
  <q-page padding class="reservations-page">
    <div class="page-header">
      <h1>Réservations</h1>
    </div>

    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Réservations cette semaine</div>
        <div class="stat-value">{{ reservationsThisWeek }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Réservations aujourd'hui</div>
        <div class="stat-value">{{ reservationsToday }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Réservations en attente</div>
        <div class="stat-value">{{ pendingReservations }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Réservations confirmées</div>
        <div class="stat-value">{{ confirmedReservations }}</div>
      </div>
    </div>

    <div class="charts-row">
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition des Réservations</div>
          <q-chart
            :options="reservationChartOptions"
            :series="reservationChartSeries"
            type="donut"
            height="200"
          />
        </q-card-section>
      </q-card>
    </div>

    <div class="map-container">
      <LeafletMap />
    </div>
  </q-page>
</template>

<script>
import LeafletMap from 'components/LeafletMap.vue';

export default {
  name: 'ReservationsPage',
  components: { LeafletMap },
  data() {
    return {
      reservationsThisWeek: 120,
      reservationsToday: 10,
      pendingReservations: 5,
      confirmedReservations: 115,
      reservationChartOptions: {
        chart: { toolbar: { show: false } },
        labels: ['Plage', 'Hiver', 'Ville'],
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '70%' } } }
      },
      reservationChartSeries: [40, 30, 30]
    };
  }
};
</script>

<style scoped>
.reservations-page {
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
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  flex: 1 1 200px;
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

.charts-row {
  display: flex;
  margin-bottom: 24px;
}
.chart-card {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.chart-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.map-container {
  width: 100%;
  height: 400px;
  margin-top: 24px;
}
.map-container >>> .leaflet-container {
  width: 100%;
  height: 100%;
}
</style>
