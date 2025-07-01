<template>
  <q-page padding class="notifications-page">
    <div class="page-header">
      <h1>Notifications</h1>
    </div>
    <q-table
      title="Liste des notifications"
      :rows="notifications"
      :columns="columns"
      row-key="id"
      flat bordered dense
      :loading="loading"
    />
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'

export default {
  name: 'NotificationsPage',
  data() {
    return {
      notifications: [],
      loading: false,
      columns: [
        { name: 'category', label: 'Catégorie', field: 'category', sortable: true },
        { name: 'message', label: 'Message', field: 'message', sortable: true },
        { name: 'start_date', label: 'Date de début', field: 'start_date', format: val => val ? new Date(val).toLocaleDateString('fr-FR') : 'non définie', sortable: true },
        { name: 'end_date', label: 'Date de fin', field: 'end_date', format: val => val ? new Date(val).toLocaleDateString('fr-FR') : 'non définie', sortable: true }
      ]
    }
  },
  mounted() {
    this.fetchNotifications()
  },
  methods: {
    async fetchNotifications() {
      this.loading = true
      const { data: destinations, error: errDest } = await supabase
        .from('destinations')
        .select('id, title, categories(name)')
      const { data: reservations, error: errRes } = await supabase
        .from('reservations')
        .select('id, status, start_date, end_date, destinations(title, categories(name))')
      if (errDest || errRes) {
        console.error(errDest || errRes)
        this.loading = false
        return
      }
      const destNotifications = destinations.map(d => ({
        id: d.id,
        category: d.categories?.name || 'non définie',
        message: `Ajout : ${d.title}`,
        start_date: null,
        end_date: null
      }))
      const resNotifications = reservations.map(r => ({
        id: r.id,
        category: r.destinations?.categories?.name || 'non définie',
        message: `Réservation ${r.status} pour : ${r.destinations?.title || 'inconnue'}`,
        start_date: r.start_date,
        end_date: r.end_date
      }))
      this.notifications = [...destNotifications, ...resNotifications]
        .sort((a, b) => {
          const da = a.start_date || a.end_date || ''
          const db = b.start_date || b.end_date || ''
          return new Date(db) - new Date(da)
        })
      this.loading = false
    }
  }
}
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
</style>
