<template>
  <q-page padding class="statistics-page">
    <div class="page-header">
      <h1>Catégories favorites et Statistiques</h1>
    </div>

    <div class="cards-row mb-8">
      <div class="stat-card">
        <div class="stat-title">Total des roadtrips</div>
        <div class="stat-value">{{ totalTrips }}</div>
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

    <div class="charts-row">
      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition par catégorie</div>
          <apexchart
            :height="220" type="pie"
            :options="categoryChart.options"
            :series="categoryChart.series"
          />
        </q-card-section>
      </q-card>

      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Répartition des réservations</div>
          <apexchart
            :height="220" type="donut"
            :options="userPrefChart.options"
            :series="userPrefChart.series"
          />
        </q-card-section>
      </q-card>
    </div>

    <div class="reviews-section q-pa-md">
      <h2>Avis utilisateurs</h2>
      <ul class="reviews-list">
        <li
          v-for="review in reviewsList"
          :key="review.id"
          class="review-item q-pa-sm q-mb-sm bg-white shadow-1 rounded"
        >
          <div class="text-subtitle1">{{ review.destinationTitle || 'Destination inconnue' }}</div>
          <div class="text-caption">Note : {{ review.rating }} / 5</div>
          <p class="q-mt-sm">{{ review.comment }}</p>
          <div class="text-caption text-grey">
            le {{ new Date(review.created_at).toLocaleDateString('fr-FR') }}
          </div>
        </li>
      </ul>
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
      tripsThisMonth: 0,
      totalReservations: 0,
      reservationsThisMonth: 0,
      totalDestinations: 0,

      categoryChart: { series: [], options: { labels: [], legend: { position: 'bottom' } } },
      userPrefChart:  { series: [], options: { labels: [], legend: { position: 'bottom' } } },

      reviewsList: []
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

        // --- CATEGORIES ---
        const { data: categories, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
        if (catErr) {
          console.error('Erreur catégories :', catErr)
          return
        }
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

        // --- DESTINATIONS ---
        const { data: destinations, error: destErr } = await supabase
          .from('destinations')
          .select('id, title, created_at, category_id')
        if (destErr) {
          console.error('Erreur destinations :', destErr)
          return
        }

        this.totalTrips = destinations.length
        this.tripsThisMonth = destinations.filter(d => d.created_at >= firstOfMonth).length
        this.totalDestinations = destinations.length

        // Répartition par catégorie
        const catCounts = {}
        destinations.forEach(d => {
          const name = categoryMap[d.category_id] || 'Non catégorisé'
          catCounts[name] = (catCounts[name] || 0) + 1
        })
        this.categoryChart = {
          series: Object.values(catCounts),
          options: { labels: Object.keys(catCounts), legend: { position: 'bottom' } }
        }

        // --- RÉSERVATIONS ---
        const { data: reservations, error: resErr } = await supabase
          .from('reservations')
          .select('id, created_at, destination_id')
        if (resErr) {
          console.error('Erreur réservations :', resErr)
          return
        }

        this.totalReservations = reservations.length
        this.reservationsThisMonth = reservations.filter(r => r.created_at >= firstOfMonth).length

        // Répartition globale des réservations (donut)
        const resCounts = {}
        reservations.forEach(r => {
          const dest = destinations.find(d => d.id === r.destination_id)
          if (!dest) return
          const name = categoryMap[dest.category_id] || 'Non catégorisé'
          resCounts[name] = (resCounts[name] || 0) + 1
        })
        this.userPrefChart = {
          series: Object.values(resCounts),
          options: { labels: Object.keys(resCounts), legend: { position: 'bottom' } }
        }

        // --- AVIS UTILISATEURS ---
        const { data: rawReviews, error: revErr } = await supabase
          .from('reviews')
          .select('*')
        if (revErr) {
          console.error('Erreur avis :', revErr)
          this.reviewsList = []
          return
        }
        const { data: allDest, error: allDestErr } = await supabase
          .from('destinations')
          .select('id, title')
        if (allDestErr) {
          console.error('Erreur titres dest :', allDestErr)
          this.reviewsList = []
          return
        }
        const titleMap = new Map(allDest.map(d => [d.id, d.title]))

        // Garder un seul (le plus récent) par destination
        const latest = {}
        rawReviews.forEach(r => {
          const prev = latest[r.destination_id]
          if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
            latest[r.destination_id] = r
          }
        })
        this.reviewsList = Object.values(latest).map(r => ({
          ...r,
          destinationTitle: titleMap.get(r.destination_id)
        }))
      } catch (err) {
        console.error('Erreur loadStats:', err)
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
.reviews-section h2 { margin-bottom: 16px; font-size: 20px; color: #333; }
.reviews-list { list-style: none; padding: 0; }
.review-item { border: 1px solid #e0e0e0; }
.review-item .text-caption { margin-bottom: 4px; }
</style>
