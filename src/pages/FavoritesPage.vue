<template>
  <q-page padding class="statistics-page">
    <div class="page-header">
      <h1>Statistiques</h1>
    </div>

    <!-- Cartes -->
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
        <div class="stat-title">Roadtrips ce mois-ci</div>
        <div class="stat-value">{{ tripsThisMonth }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total des réservations</div>
        <div class="stat-value">{{ totalReservations }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Réservations ce mois-ci</div>
        <div class="stat-value">{{ reservationsThisMonth }}</div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="charts-row">
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Types de roadtrips (par catégorie)</div>
          <apexchart
  height="220"
  type="pie"
  :options="tripChart.options"
  :series="tripChart.series"
/>

        </q-card-section>
      </q-card>

      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Statuts des réservations</div>
          <apexchart
  height="220"
  type="donut"
  :options="reservationChart.options"
  :series="reservationChart.series"
/>

        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'
import ApexChart from 'vue3-apexcharts'

export default {
  name: 'StatistiquesPage',
  components: {
    apexchart: ApexChart
  },
  data () {
    return {
      totalTrips: 0,
      averageDuration: 0,
      tripsThisMonth: 0,
      totalReservations: 0,
      reservationsThisMonth: 0,

      tripChart: {
        series: [],
        options: {
          labels: [],
          chart: { toolbar: { show: false } },
          legend: { position: 'bottom' }
        }
      },
      reservationChart: {
        series: [],
        options: {
          labels: [],
          chart: { toolbar: { show: false } },
          legend: { position: 'bottom' }
        }
      }
    }
  },

  mounted () {
    this.loadStats()
  },

  methods: {
    async loadStats () {
      try {
        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // 📦 Catégories
        const { data: categories, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
        if (catErr) throw catErr
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

        // 📦 Destinations
        const { data: destinations, error: destErr } = await supabase
          .from('destinations')
          .select('id, startTime, endTime, created_at, category_id')
        if (destErr) throw destErr

        this.totalTrips = destinations.length
        const durations = destinations
          .filter(d => d.startTime && d.endTime)
          .map(d => (new Date(d.endTime) - new Date(d.startTime)) / 86400000)
        this.averageDuration = durations.length
          ? Math.round(durations.reduce((a, b) => a + b) / durations.length)
          : 0
        this.tripsThisMonth = destinations.filter(d => d.created_at >= firstOfMonth).length

        const catCounts = {}
        destinations.forEach(d => {
          const name = categoryMap[d.category_id] || 'Non catégorisé'
          catCounts[name] = (catCounts[name] || 0) + 1
        })

        // ✅ Forcer mise à jour complète de l'objet (pour ApexCharts)
        this.tripChart = {
          series: Object.values(catCounts),
          options: {
            ...this.tripChart.options,
            labels: Object.keys(catCounts),
            chart: { toolbar: { show: false } },
            legend: { position: 'bottom' }
          }
        }

        // 📦 Réservations
        const { data: reservations, error: resErr } = await supabase
          .from('reservations')
          .select('id, status, created_at')
        if (resErr) throw resErr

        this.totalReservations = reservations.length
        this.reservationsThisMonth = reservations.filter(r => r.created_at >= firstOfMonth).length

        const statCounts = {}
        reservations.forEach(r => {
          const s = (r.status || 'Inconnu').toLowerCase()
          statCounts[s] = (statCounts[s] || 0) + 1
        })

        this.reservationChart = {
          series: Object.values(statCounts),
          options: {
            ...this.reservationChart.options,
            labels: Object.keys(statCounts),
            chart: { toolbar: { show: false } },
            legend: { position: 'bottom' }
          }
        }

        // Debug
        console.log('Catégories :', this.tripChart.options.labels)
        console.log('Statuts    :', this.reservationChart.options.labels)

      } catch (e) {
        console.error('Erreur chargement statistiques :', e)
      }
    }
  }
}
</script>

<style scoped>
.statistics-page {
  background: #f9fafa;
  min-height: 100%;
}
.page-header h1 {
  margin-bottom: 24px;
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
  flex: 1 1 220px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px #0001;
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
  flex-wrap: wrap;
  gap: 16px;
}
.chart-card {
  flex: 1 1 300px;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px #00000010;
}
.chart-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

</style>
