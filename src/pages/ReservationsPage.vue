<template>
  <q-page padding class="reservations-page">
    <div class="page-header"><h1>Réservations</h1></div>

    <!-- Statistiques -->
    <div class="cards-row">
      <div class="stat-card" v-for="card in statCards" :key="card.label">
        <div class="stat-title">{{ card.label }}</div>
        <div class="stat-value">{{ card.value }}</div>
      </div>
    </div>

    <!-- Tableau des réservations -->
    <div class="cards-row">
      <div class="table-card">
        <q-table
          :rows="formattedReservations"
          :columns="columns"
          row-key="id"
          flat bordered dense
          :loading="loading"
        >
          <template v-slot:body-cell-actions="props">
            <q-td align="right">
              <q-btn dense flat icon="edit" color="primary" @click="editReservation(props.row)" />
              <q-btn dense flat icon="delete" color="negative" @click="deleteReservation(props.row.id)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'
export default {
  name: 'ReservationsPage',
  data() {
    return {
      loading: false,
      reservations: [],
      destinations: [],
      // Stats
      reservationsThisWeek: 0,
      reservationsToday: 0,
      pendingReservations: 0,
      confirmedReservations: 0,
      columns: [
        { name: 'destination', label: 'Destination', field: 'destination' },
        { name: 'number_of_people', label: 'Personnes', field: 'number_of_people' },
        { name: 'total_price', label: 'Prix total (€)', field: 'total_price', format: v => `${v} €` },
        { name: 'start_date', label: 'Début', field: 'start_date', format: v => v ? new Date(v).toLocaleDateString() : '—' },
        { name: 'end_date', label: 'Fin', field: 'end_date', format: v => v ? new Date(v).toLocaleDateString() : '—' },
        { name: 'status', label: 'Statut', field: 'status' },
        { name: 'actions', label: 'Actions', field: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    statCards() {
      return [
        { label: "Aujourd'hui", value: this.reservationsToday },
        { label: 'Cette semaine', value: this.reservationsThisWeek },
        { label: 'En attente', value: this.pendingReservations },
        { label: 'Confirmées', value: this.confirmedReservations }
      ]
    },
    formattedReservations() {
      return this.reservations.map(r => {
        const dest = this.destinations.find(d => d.id === r.destination_id)
        return {
          ...r,
          destination: dest ? dest.title : '—'
        }
      })
    }
  },
  async mounted() {
    await this.refreshAll()
  },
  methods: {
    async refreshAll() {
      this.loading = true
      const today = new Date().toISOString().slice(0,10)
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

      const [{ data: resData, error: resErr }, { data: destData, error: destErr }] = await Promise.all([
        supabase.from('reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('destinations').select('id, title')
      ])
      if (resErr) {
        console.error('Erreur chargement réservations :', resErr.message)
        this.reservations = []
      } else {
        this.reservations = resData
        this.reservationsToday = resData.filter(r => r.created_at.startsWith(today)).length
        this.reservationsThisWeek = resData.filter(r => new Date(r.created_at) >= weekAgo).length
        this.pendingReservations = resData.filter(r => r.status === 'en attente').length
        this.confirmedReservations = resData.filter(r => r.status === 'confirmée').length
      }
      if (destErr) console.error('Erreur fetch destinations :', destErr.message)
      else this.destinations = destData

      this.loading = false
    },
    editReservation(res) {
      this.$router.push({ name: 'EditReservation', params: { id: res.id } })
    },
    async deleteReservation(id) {
      if (!confirm('Supprimer cette réservation ?')) return
      const { error } = await supabase.from('reservations').delete().eq('id', id)
      if (error) console.error('Erreur suppression :', error.message)
      else this.refreshAll()
    }
  }
}
</script>

<style scoped>
.reservations-page { background: #f9fafa; min-height: 100% }
.page-header h1 { margin: 0 0 24px; font-size: 24px; color: #333 }
.cards-row { display: flex; gap: 16px; margin-bottom: 24px }
.stat-card { flex: 1 1 200px; background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.05) }
.table-card { flex: 1; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden }
</style>
