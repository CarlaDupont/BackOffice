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
          <div class="chart-title">Préférences utilisateurs</div>
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
      averageDuration: 0,
      tripsThisMonth: 0,
      totalReservations: 0,
      reservationsThisMonth: 0,
      totalDestinations: 0,
      categoryChart: { series: [], options: { labels: [], legend: { position: 'bottom' } } },
      userPrefChart: { series: [], options: { labels: [], legend: { position: 'bottom' } } },
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

        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
        if (categoriesError) {
          console.error('Erreur Supabase lors du chargement des catégories :', categoriesError)
          return
        }
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

        const { data: destinations, error: destinationsError } = await supabase
          .from('destinations')
          .select('id, title, created_at, category_id')
        if (destinationsError) {
          console.error('Erreur Supabase lors du chargement des destinations :', destinationsError)
          return
        }

        this.totalTrips = destinations.length
        const durations = destinations
          .filter(d => d.startTime && d.endTime)
          .map(d => (new Date(d.endTime) - new Date(d.startTime)) / 86400000)
        this.averageDuration = durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0
        this.tripsThisMonth = destinations.filter(d => d.created_at >= firstOfMonth).length
        this.totalDestinations = destinations.length

        const catCounts = {}
        destinations.forEach(d => {
          const name = categoryMap[d.category_id] || 'Non catégorisé'
          catCounts[name] = (catCounts[name] || 0) + 1
        })
        this.categoryChart = {
          series: Object.values(catCounts),
          options: { labels: Object.keys(catCounts), legend: { position: 'bottom' } }
        }

        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('id, created_at, user_id, destination_id')
        if (reservationsError) {
          console.error('Erreur Supabase lors du chargement des réservations :', reservationsError)
          return
        }
        this.totalReservations = reservations.length
        this.reservationsThisMonth = reservations.filter(r => r.created_at >= firstOfMonth).length

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

        const { data: rawReviews, error: rawReviewsError } = await supabase
          .from('reviews')
          .select('*')
        if (rawReviewsError) {
          console.error('Erreur Supabase lors du chargement des avis bruts :', rawReviewsError)
          this.reviewsList = []
          return
        }

        const { data: allDestinations, error: allDestinationsError } = await supabase
          .from('destinations')
          .select('id, title')
        if (allDestinationsError) {
          console.error('Erreur Supabase lors du chargement des destinations pour les avis :', allDestinationsError)
          this.reviewsList = []
          return
        }
        const destinationTitles = new Map(allDestinations.map(d => [d.id, d.title]))

        const { data: allUsers, error: allUsersError } = await supabase
          .from('user')
          .select('id, email')
        if (allUsersError) {
          console.error('Erreur Supabase lors du chargement des utilisateurs pour les avis :', allUsersError)
          this.reviewsList = []
          return
        }
        const userEmails = new Map(allUsers.map(u => [u.id, u.email]))

        if (rawReviews) {
          const processedReviews = rawReviews.map(review => ({
            ...review,
            destinationTitle: destinationTitles.get(review.destination_id),
            userEmail: userEmails.get(review.user_id)
          }))
          const reviewMap = {}
          processedReviews.forEach(r => {
            const prev = reviewMap[r.destination_id]
            if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
              reviewMap[r.destination_id] = r
            }
          })
          this.reviewsList = Object.values(reviewMap)
        } else {
          this.reviewsList = []
        }
      } catch (error) {
        console.error('Erreur chargement des statistiques globale :', error)
      }
    }
  }
}
</script>

<style scoped>
.statistics-page { background: #f9fafa; min-height: 100% }
.page-header h1 { margin-bottom: 24px; font-size: 24px; color: #333 }
.cards-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px }
.stat-card { flex: 1 1 180px; background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 2px 6px #0001 }
.stat-title { font-size: 14px; color: #666; margin-bottom: 8px }
.stat-value { font-size: 28px; color: #222 }
.charts-row { display: flex; flex-wrap: wrap; gap: 16px }
.chart-card { flex: 1 1 300px; background: #fff; border-radius: 8px; padding: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1) }
.chart-title { font-size: 14px; color: #333; margin-bottom: 8px }

.reviews-section h2 { margin-bottom: 16px; font-size: 20px; color: #333 }
.reviews-list { list-style: none; padding: 0 }
.review-item { border: 1px solid #e0e0e0 }
</style>
