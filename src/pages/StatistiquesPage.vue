<template>
  <q-page padding class="statistics-page">
    <div class="page-header">
      <h1>Statistiques</h1>
    </div>

    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Total des roadtrips</div>
        <div class="stat-value">{{ totalTrips }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Durée moyenne (jours)</div>
        <div class="stat-value">{{ averageDuration }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Roadtrips par type</div>
        <div class="stat-row">
          <div><strong>Plage</strong><br>{{ beachCount }}</div>
          <div><strong>Hiver</strong><br>{{ winterCount }}</div>
          <div><strong>Ville</strong><br>{{ cityCount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Roadtrips ce mois-ci</div>
        <div class="stat-value">{{ tripsThisMonth }}</div>
      </div>
    </div>

    <div class="charts-row">
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition des roadtrips</div>
          <q-chart
            :options="tripChartOptions"
            :series="tripChartSeries"
            type="pie"
            height="250"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'StatistiquesPage',
  data() {
    return {
      totalTrips: 200,
      averageDuration: 7,
      beachCount: 80,
      winterCount: 60,
      cityCount: 60,
      tripsThisMonth: 45,
      tripChartOptions: {
        labels: ['Plage', 'Hiver', 'Ville'],
        colors: ['#FFB74D', '#4FC3F7', '#AED581'],
        legend: { position: 'bottom' },
        chart: { toolbar: { show: false } }
      },
      tripChartSeries: [40, 30, 30]
    };
  }
};
</script>

<style scoped>
.statistics-page {
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
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #555;
}

.charts-row {
  display: flex;
  gap: 16px;
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
</style>
