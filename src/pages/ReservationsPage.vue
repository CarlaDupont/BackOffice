<template>
  <q-page padding class="reservations-page">
    <div class="page-header"><h1>Réservations</h1></div>

    <!-- Statistiques globales -->
    <div class="cards-row">
      <div class="stat-card" v-for="card in statCards" :key="card.label">
        <div class="stat-title">{{ card.label }}</div>
        <div class="stat-value">{{ card.value }}</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="q-mb-md row justify-end gap-2">
      <q-btn label="Ajouter une réservation" color="primary" @click="openAddReservationDialog" />
    </div>

    <!-- Tableau des réservations -->
    <q-table
      title="Liste des réservations"
      :rows="reservations"
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

    <!-- Dialog : ajout / édition -->
    <q-dialog v-model="dialogAddReservation" persistent>
      <q-card style="min-width:380px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Modifier' : 'Nouvelle' }} réservation</div>
          <q-select
            v-model="newReservation.user_id"
            :options="users"
            option-label="email"
            option-value="id"
            emit-value
            map-options
            label="Utilisateur"
            outlined dense class="q-mt-md"
          />
          <q-select
            v-model="newReservation.destination_id"
            :options="destinations"
            option-label="title"
            option-value="id"
            emit-value
            map-options
            label="Destination"
            outlined dense class="q-mt-md"
          />
          <q-select
            v-model="newReservation.status"
            :options="statusOptions"
            label="Statut"
            outlined dense class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" @click="dialogAddReservation = false" />
          <q-btn flat :label="editMode ? 'Enregistrer' : 'Ajouter'" color="primary" @click="submitReservation" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'

export default {
  name: 'ReservationsPage',
  data () {
    return {
      loading: false,
      reservations: [],
      users: [],
      destinations: [],
      dialogAddReservation: false,
      newReservation: { id: null, user_id: null, destination_id: null, status: 'confirmée' },
      statusOptions: ['confirmée', 'en attente'],
      editMode: false,

      reservationsThisWeek: 0,
      reservationsToday: 0,
      pendingReservations: 0,
      confirmedReservations: 0,

      columns: [
        { name: 'email', label: 'Utilisateur', field: row => row.user?.email || '—' },
        { name: 'destination', label: 'Destination', field: row => row.destination?.title || '—' },
        { name: 'category', label: 'Catégorie', field: row => row.destination?.category?.name || '—' },
        { name: 'status', label: 'Statut', field: 'status' },
        { name: 'created_at', label: 'Date', field: 'created_at', format: v => new Date(v).toLocaleDateString() },
        { name: 'actions', label: '', field: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    statCards () {
      return [
        { label: 'Réservations cette semaine', value: this.reservationsThisWeek },
        { label: "Réservations aujourd'hui", value: this.reservationsToday },
        { label: 'Réservations en attente', value: this.pendingReservations },
        { label: 'Réservations confirmées', value: this.confirmedReservations }
      ]
    }
  },
  mounted () {
    this.refreshAll()
  },
  methods: {
    async refreshAll () {
      this.loading = true
      await Promise.all([
        this.fetchReservations(),
        this.fetchUsers(),
        this.fetchDestinations()
      ])
      this.loading = false
    },

    async fetchReservations () {
      const { data, error } = await supabase
        .from('reservations')
        .select(`*,
          user:user(email),
          destination:destinations(
            title,
            category:categories(name)
          )`)

      if (error) {
        console.error('Erreur chargement réservations :', error)
        this.reservations = []
        return
      }
      this.reservations = data

      const today = new Date().toISOString().slice(0, 10)
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() - 7)

      this.reservationsToday = data.filter(r => r.created_at?.startsWith(today)).length
      this.reservationsThisWeek = data.filter(r => new Date(r.created_at) >= weekDate).length
      this.pendingReservations = data.filter(r => r.status === 'en attente').length
      this.confirmedReservations = data.filter(r => r.status === 'confirmée').length
    },

    async fetchUsers () {
      const { data, error } = await supabase.from('user').select('id, email')
      if (error) return console.error('Erreur fetch users:', error)
      this.users = data
    },

    async fetchDestinations () {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, title')
      if (error) return console.error('Erreur fetch destinations:', error)
      this.destinations = data
    },

    openAddReservationDialog () {
      this.newReservation = { id: null, user_id: null, destination_id: null, status: 'confirmée' }
      this.editMode = false
      this.dialogAddReservation = true
    },

    async submitReservation () {
      const { id, user_id, destination_id, status } = this.newReservation
      if (!user_id || !destination_id) return

      const { data, error: fetchError } = await supabase
        .from('destinations')
        .select('category_id')
        .eq('id', destination_id)
        .single()

      if (fetchError) return console.error('Erreur récupération catégorie:', fetchError)
      const category_id = data?.category_id

      if (this.editMode) {
        const { error } = await supabase.from('reservations')
          .update({ user_id, destination_id, category_id, status })
          .eq('id', id)
        if (error) return console.error('Erreur update réservation:', error)
      } else {
        const { error } = await supabase.from('reservations')
          .insert({ user_id, destination_id, category_id, status })
        if (error) return console.error('Erreur insert réservation:', error)
      }

      this.dialogAddReservation = false
      this.refreshAll()
    },

    editReservation (row) {
      this.newReservation = {
        id: row.id,
        user_id: row.user?.id || row.user_id,
        destination_id: row.destination?.id || row.destination_id,
        status: row.status
      }
      this.editMode = true
      this.dialogAddReservation = true
    },

    async deleteReservation (id) {
      if (!confirm('Supprimer cette réservation ?')) return
      const { error } = await supabase.from('reservations').delete().eq('id', id)
      if (error) return console.error('Erreur suppression réservation:', error)
      this.refreshAll()
    }
  }
}
</script>

<style scoped>
.reservations-page { background:#f9fafa; min-height:100%; }
.page-header h1 { margin:0 0 24px; font-size:24px; color:#333; }
.cards-row { display:flex; flex-wrap:wrap; gap:16px; margin-bottom:24px; }
.stat-card { flex:1 1 200px; background:#ffffff; border-radius:8px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.05); }
.stat-title { font-size:14px; color:#666; margin-bottom:8px; }
.stat-value { font-size:28px; color:#222; }
.charts-row { display:flex; margin-bottom:24px; gap:24px; }
.chart-card { flex:1; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); }
.chart-title { font-size:16px; color:#333; margin-bottom:12px; }
</style>
