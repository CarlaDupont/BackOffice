<template>
  <q-page padding class="statistics-page">
    <!-- En-tête -->
    <div class="page-header">
      <h1>Catégories favorites et Statistiques</h1>
    </div>

    <!-- Totaux et autres Stats -->
    <div class="cards-row mb-8">
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
      <div class="stat-card">
        <div class="stat-title">Total des destinations</div>
        <div class="stat-value">{{ totalDestinations }}</div>
      </div>
    </div>

    <!-- Graphiques : Catégories + Préférences utilisateurs -->
    <div class="charts-row">
      <!-- Donut Catégories -->
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition par catégorie</div>
          <apexchart
            height="220"
            type="pie"
            :options="categoryChart.options"
            :series="categoryChart.series"
          />
        </q-card-section>
      </q-card>

      <!-- Donut Préférences utilisateurs -->
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Préférences utilisateurs</div>
          <apexchart
            height="220"
            type="donut"
            :options="userPrefChart.options"
            :series="userPrefChart.series"
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
  name: 'StatisticsPage',
  components: { apexchart: ApexChart },
  data() {
    return {
      totalTrips: 0,
      averageDuration: 0,
      tripsThisMonth: 0,
      totalReservations: 0,
      reservationsThisMonth: 0,
      totalDestinations: 0,
      categoryChart: { series: [], options: { labels: [], legend: { position: 'bottom' } } },
      userPrefChart: { series: [], options: { labels: [], legend: { position: 'bottom' } } }
    }
  },
  mounted() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // Charger catégories
        const { data: categories } = await supabase.from('categories').select('id, name')
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

        // Charger destinations (roadtrips)
        const { data: destinations } = await supabase.from('destinations')
          .select('id, startTime, endTime, created_at, category_id')

        // Stats de base
        this.totalTrips = destinations.length
        const durations = destinations
          .filter(d => d.startTime && d.endTime)
          .map(d => (new Date(d.endTime) - new Date(d.startTime)) / 86400000)
        this.averageDuration = durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0
        this.tripsThisMonth = destinations.filter(d => d.created_at >= firstOfMonth).length
        this.totalDestinations = destinations.length

        // Chart Répartition par catégorie
        const catCounts = {}
        destinations.forEach(d => {
          const name = categoryMap[d.category_id] || 'Non catégorisé'
          catCounts[name] = (catCounts[name] || 0) + 1
        })
        this.categoryChart = {
          series: Object.values(catCounts),
          options: { labels: Object.keys(catCounts), legend: { position: 'bottom' } }
        }

        // Charger réservations
        const { data: reservations } = await supabase.from('reservations')
          .select('id, created_at, user_id, destination_id')
        this.totalReservations = reservations.length
        this.reservationsThisMonth = reservations.filter(r => r.created_at >= firstOfMonth).length

        // Chart Préférences utilisateurs (catégorie favorite par utilisateur)
        const userCatMap = {}
        reservations.forEach(r => {
          const dest = destinations.find(d => d.id === r.destination_id)
          if (!dest) return
          const cat = categoryMap[dest.category_id] || 'Non catégorisé'
          if (!userCatMap[r.user_id]) userCatMap[r.user_id] = {}
          userCatMap[r.user_id][cat] = (userCatMap[r.user_id][cat] || 0) + 1
        })
        const prefCounts = {}
        Object.values(userCatMap).forEach(userMap => {
          const favCat = Object.keys(userMap).reduce((a, b) => userMap[a] > userMap[b] ? a : b)
          prefCounts[favCat] = (prefCounts[favCat] || 0) + 1
        })
        this.userPrefChart = {
          series: Object.values(prefCounts),
          options: { labels: Object.keys(prefCounts), legend: { position: 'bottom' } }
        }
      } catch (e) {
        console.error('Erreur chargement stats :', e)
      }
    }
  }
}
</script>

<style scoped>
.statistics-page { background: #f9fafa; min-height: 100%; }
.page-header h1 { margin-bottom: 24px; font-size: 24px; color: #333; }
.cards-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.stat-card { flex: 1 1 180px; background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 2px 6px #0001; }
.stat-title { font-size: 14px; color: #666; margin-bottom: 8px; }
.stat-value { font-size: 28px; color: #222; }
.charts-row { display: flex; flex-wrap: wrap; gap: 16px; }
.chart-card { flex: 1 1 300px; background: #fff; border-radius: 8px; padding: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.chart-title { font-size: 14px; color: #333; margin-bottom: 8px; }
</style>
