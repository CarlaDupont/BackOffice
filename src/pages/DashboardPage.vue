<template>
  <q-page padding class="dashboard-page">
    <div class="dashboard-header"><h1>Dashboard</h1></div>

    <!-- Notifications -->
    <div class="notifications-row">
      <div class="notif-card">
        <div class="notif-title">Notifications (7&nbsp;derniers jours)</div>
        <div class="notif-count">
          {{ (reservationsLast7Days || 0) + (destinationsLast7Days || 0) }}
        </div>
      </div>
      <div class="notif-card">
        <div class="notif-title">Destinations</div>
        <div class="notif-count">{{ destinations.length }}</div>
      </div>
      <div class="notif-card">
        <div class="notif-title">Réservations</div>
        <div class="notif-count">{{ reservations.length }}</div>
      </div>
    </div>

    <!-- Résumé 7 jours -->
    <div class="recent-summary-row">
      <div class="recent-summary-box">
        <div class="recent-title">Destinations (7&nbsp;derniers jours)</div>
        <div class="recent-value">{{ destinationsLast7Days }}</div>
      </div>
      <div class="recent-summary-box">
        <div class="recent-title">Réservations (7&nbsp;derniers jours)</div>
        <div class="recent-value">{{ reservationsLast7Days }}</div>
      </div>
    </div>

    <!-- Cartes statistiques -->
    <div class="cards-row">
      <div class="stat-card">
        <div class="stat-title">Réservations cette semaine</div>
        <div class="stat-value">{{ reservationsThisWeek }}</div>
        <div class="stat-sub">Aujourd'hui {{ reservationsToday }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total des destinations</div>
        <div class="stat-row">
          <div v-for="(count, cat) in destinationsByCategory" :key="cat">
            <strong>{{ cat }}</strong><br>{{ count }}
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Réservations par statut</div>
        <div class="stat-row">
          <div v-for="(count, stat) in reservationsByStatus" :key="stat">
            <strong>{{ stat }}</strong><br>{{ count }}
          </div>
        </div>
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
            :options="destOptions"
            :series="destSeries"
          />
        </q-card-section>
      </q-card>

      <q-card class="chart-card">
        <q-card-section>
          <div class="chart-title">Tendances des réservations (7 jours)</div>
          <apexchart
            height="200"
            type="line"
            :options="trendOptions"
            :series="trendSeries"
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
  name: 'DashboardPage',
  components: { apexchart: ApexChart },
  data () {
    return {
      notifications: [],
      destinations: [],
      reservations: [],
      destinationsByCategory: {},
      reservationsByStatus: {},
      reservationsToday: 0,
      reservationsThisWeek: 0,
      destinationsLast7Days: 0,
      reservationsLast7Days: 0,
      destOptions: {
        labels: [],
        chart: { toolbar: { show: false } },
        legend: { position: 'bottom' }
      },
      destSeries: [],
      trendOptions: {
        chart: { toolbar: { show: false } },
        xaxis: { categories: [] },
        stroke: { curve: 'smooth' }
      },
      trendSeries: [{ name: 'Réservations', data: [] }]
    }
  },
  mounted () {
    this.loadDashboard()
  },
  methods: {
    async loadDashboard () {
      const today = new Date()
      const startOfDayISO = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const startOfWeekISO = startOfWeek.toISOString()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
      this.notifications = notifData || []

      const { data: destData } = await supabase.from('destinations').select('id, created_at, category_id, categories(name)').order('created_at', { ascending: false })
      this.destinations = destData || []

      const catCount = {}
      for (const d of this.destinations) {
        const name = d.categories?.name || 'Non catégorisé'
        catCount[name] = (catCount[name] || 0) + 1
      }
      this.destinationsByCategory = catCount
      this.destOptions = {
        labels: Object.keys(catCount),
        chart: { toolbar: { show: false } },
        legend: { position: 'bottom' }
      }
      this.destSeries = Object.values(catCount)
      this.destinationsLast7Days = this.destinations.filter(d => d.created_at >= sevenDaysAgoISO).length

      const { data: resData } = await supabase.from('reservations').select('id, status, created_at').order('created_at', { ascending: false })
      this.reservations = resData || []

      const statCount = {}
      for (const r of this.reservations) {
        const st = (r.status || 'inconnu').toLowerCase()
        statCount[st] = (statCount[st] || 0) + 1
      }
      this.reservationsByStatus = statCount
      this.reservationsToday = this.reservations.filter(r => r.created_at >= startOfDayISO).length
      this.reservationsThisWeek = this.reservations.filter(r => r.created_at >= startOfWeekISO).length
      this.reservationsLast7Days = this.reservations.filter(r => r.created_at >= sevenDaysAgoISO).length

      const days = [...Array(7)].map((_, i) => {
        const date = new Date()
        date.setDate(today.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })
      this.trendOptions.xaxis.categories = days.map(d => d.slice(5))
      this.trendSeries = [{ name: 'Réservations', data: days.map(d => this.reservations.filter(r => r.created_at.startsWith(d)).length) }]
    }
  }
}
</script>

<style scoped>
.dashboard-page { background:#f9fafa; min-height:100%; }
.dashboard-header h1 { margin:0 0 24px; font-size:24px; color:#333; }
.notifications-row { display:flex; gap:16px; margin-bottom:24px; }
.notif-card {
  flex:1;
  border-radius:8px;
  padding:16px;
  box-shadow:0 1px 4px #0001;
  text-align:center;
  background:#e3f2fd;
}
.notif-title { font-size:14px; color:#555; margin-bottom:8px; }
.notif-count { font-size:20px; font-weight:600; color:#222; }
.recent-summary-row { display:flex; gap:16px; margin-bottom:24px; }
.recent-summary-box { flex:1; background:#f0f4f8; border-radius:8px; padding:16px; text-align:center; box-shadow:0 1px 4px #0001; }
.recent-title { font-size:14px; color:#555; margin-bottom:8px; }
.recent-value { font-size:22px; font-weight:600; color:#333; }
.cards-row { display:flex; gap:16px; margin-bottom:24px; }
.stat-card { flex:1; background:#fff; border-radius:8px; padding:16px; box-shadow:0 2px 6px #0000000d; }
.stat-title { font-size:14px; color:#666; margin-bottom:8px; }
.stat-value { font-size:28px; color:#222; margin-bottom:4px; }
.stat-sub { font-size:12px; color:#999; }
.stat-row { display:flex; justify-content:space-between; font-size:14px; color:#555; }
.charts-row { display:flex; gap:16px; flex-wrap: wrap; }
.chart-card { flex:1; background:#fff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); padding: 8px; }
.chart-title { font-size:14px; color:#333; margin-bottom:4px; }
</style>
