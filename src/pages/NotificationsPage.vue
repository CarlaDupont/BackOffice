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
  data () {
    return {
      notifications: [],
      loading: false,
      columns: [
        { name: 'type', label: 'Type', field: 'type', sortable: true },
        { name: 'message', label: 'Message', field: 'message', sortable: true },
        { name: 'created_at', label: 'Date', field: 'created_at', format: val => new Date(val).toLocaleString(), sortable: true }
      ]
    }
  },
  mounted () {
    this.fetchNotifications()
  },
  methods: {
    async fetchNotifications () {
      this.loading = true

      // Récupérer les destinations (avec leur catégorie)
      const { data: destinations, error: errDest } = await supabase
        .from('destinations')
        .select(`
          id,
          title,
          startTime,
          endTime,
          created_at,
          categories ( name )
        `)

      // Récupérer les réservations (avec la destination associée et sa catégorie)
      const { data: reservations, error: errRes } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          created_at,
          destinations (
            title,
            startTime,
            endTime,
            categories ( name )
          )
        `)

      if (errDest || errRes) {
        console.error('Erreur récupération données :', errDest || errRes)
        this.loading = false
        return
      }

      const destNotifications = destinations.map(d => ({
        id: d.id,
        type: 'Destination',
        message: `Ajout : ${d.title} — Catégorie : ${d.categories?.name || 'non définie'} — du ${this.formatDate(d.startTime)} au ${this.formatDate(d.endTime)}`,
        created_at: d.created_at
      }))

      const resNotifications = reservations.map(r => {
        const dest = r.destinations
        return {
          id: r.id,
          type: 'Réservation',
          message: `Réservation ${r.status} pour : ${dest?.title || 'inconnue'} — Catégorie : ${dest?.categories?.name || 'non définie'} — du ${this.formatDate(dest?.startTime)} au ${this.formatDate(dest?.endTime)}`,
          created_at: r.created_at
        }
      })

      // Fusion des deux types de notifications
      this.notifications = [...destNotifications, ...resNotifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      this.loading = false
    },
    formatDate (date) {
      if (!date) return 'non définie'
      return new Date(date).toLocaleDateString()
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
