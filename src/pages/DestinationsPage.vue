<template>
  <q-page padding class="destinations-page">
    <div class="page-header"><h1>Destinations</h1></div>

    <div class="cards-row">
      <div class="table-card">
        <q-table
          :rows="destinations"
          :columns="columns"
          :rows-per-page-options="[5, 10, 15]"
          flat dense
          row-key="id"
        >
          <template v-slot:body-cell-image="props">
            <q-td>
              <img
                v-if="props.row.image_url"
                :src="props.row.image_url"
                alt=""
                style="height:60px; border-radius:4px; object-fit:cover;"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td>
              <q-btn dense flat icon="edit" color="primary" @click="openEditDestinationDialog(props.row)" />
              <q-btn dense flat icon="delete" color="negative" @click="deleteDestination(props.row)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <div class="section-row justify-end">
      <q-btn label="Ajouter une destination" color="primary" @click="openAddDestinationDialog" />
    </div>

    <!-- Carte générale des destinations -->
    <div class="map-full-container">
      <LeafletMap :center="defaultCenter" :markers="allMarkers" />
    </div>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width:400px; max-width:600px;">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Modifier' : 'Ajouter' }} une destination</div>
          <q-separator class="q-my-sm" />

          <q-input v-model="newDestination.title" label="Titre" outlined dense class="q-mb-sm" />
          <q-select v-model="newDestination.type" :options="destinationTypes" label="Type" outlined dense class="q-mb-sm" />
          <q-input v-model="newDestination.startTime" label="Date de début" type="date" outlined dense class="q-mb-sm" />
          <q-input v-model="newDestination.endTime" label="Date de fin" type="date" outlined dense class="q-mb-sm" />

          <q-input
            v-model="newDestination.location"
            label="Lieu"
            outlined dense
            class="q-mb-sm"
            @blur="geocodeLocation"
            hint="Déplace le focus pour géocoder"
          />

          <q-input v-model="newDestination.notes" label="Notes" type="textarea" outlined dense class="q-mb-sm" />

          <div v-if="newDestination.previewUrl" class="q-mb-sm">
            <img :src="newDestination.previewUrl" alt="Aperçu image" class="preview-img" />
          </div>
          <q-file
            v-model="newDestination.file"
            label="Image du lieu"
            outlined dense
            class="q-mb-sm"
            accept="image/*"
            @change="updatePreview"
          />

          <q-separator class="q-my-sm" />
          <div class="form-map-container q-mb-sm">
            <LeafletMap :center="formCenter" :markers="formMarkers" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" @click="dialogOpen = false" />
          <q-btn flat :label="editMode ? 'Enregistrer' : 'Ajouter'" color="positive" @click="saveDestination" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'
import LeafletMap from 'components/LeafletMap.vue'
import { Notify } from 'quasar' // <-- Add this import

export default {
  name: 'DestinationsPage',
  components: { LeafletMap },

  data() {
    return {
      defaultCenter: [48.8566, 2.3522],
      destinationTypes: [
        { label: 'Musée', value: 'musée' },
        { label: 'Spa', value: 'spa' },
        { label: 'Parc attraction', value: 'parc' },
        { label: 'Jeu pour enfant', value: 'jeu' },
        { label: 'Randonnée', value: 'randonnee' },
        { label: 'Spectacle', value: 'spectacle' }
      ],
      destinations: [],
      columns: [
        { name: 'title', label: 'Titre', field: row => row.title },
        { name: 'type', label: 'Type', field: row => row.type },
        { name: 'startTime', label: 'Début', field: row => row.startTime },
        { name: 'endTime', label: 'Fin', field: row => row.endTime },
        { name: 'location', label: 'Lieu', field: row => row.location },
        { name: 'notes', label: 'Notes', field: row => row.notes },
        { name: 'image', label: 'Image' },
        { name: 'actions', label: 'Actions' }
      ],
      dialogOpen: false,
      editMode: false,
      originalId: null,
      newDestination: {
        title: '', type: '', startTime: '', endTime: '',
        location: '', notes: '', coords: [], file: null, previewUrl: ''
      }
    }
  },

  computed: {
    allMarkers() {
      return this.destinations
        .filter(d => d.lat != null && d.lng != null)
        .map(d => ({ position: [d.lat, d.lng], popup: d.title }))
    },
    formCenter() {
      return this.newDestination.coords.length
        ? this.newDestination.coords
        : this.defaultCenter
    },
    formMarkers() {
      return this.newDestination.coords.length
        ? [{ position: this.newDestination.coords, popup: this.newDestination.title }]
        : []
    }
  },

  async mounted() {
    await this.fetchDestinations()
  },

  methods: {
    async fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, title, type, startTime, endTime, location, notes, lat, lng')
      if (error) {
        console.error('Fetch error:', error)
        return
      }
      this.destinations = data.map(d => {
        const { publicUrl } = supabase
          .storage
          .from('products')
          .getPublicUrl(`${d.id}`)
        return { ...d, image_url: publicUrl }
      })
    },

    openAddDestinationDialog() {
      this.editMode = false
      this.originalId = null
      this.newDestination = { title: '', type: '', startTime: '', endTime: '', location: '', notes: '', coords: [], file: null, previewUrl: '' }
      this.dialogOpen = true
    },

    openEditDestinationDialog(dest) {
      this.editMode = true
      this.originalId = dest.id
      this.newDestination = {
        title: dest.title,
        type: dest.type,
        startTime: dest.startTime,
        endTime: dest.endTime,
        location: dest.location,
        notes: dest.notes,
        coords: [dest.lat, dest.lng],
        file: null,
        previewUrl: dest.image_url
      }
      this.dialogOpen = true
    },

    async deleteDestination(dest) {
      const { error } = await supabase.from('destinations').delete().eq('id', dest.id)
      if (error) console.error('Delete error:', error)
      else this.destinations = this.destinations.filter(d => d.id !== dest.id)
    },

    async geocodeLocation() {
      if (!this.newDestination.location) return
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.newDestination.location)}`
        )
        const data = await res.json()
        if (data.length) {
          this.newDestination.coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        }
      } catch {
        Notify.create({ type: 'negative', message: 'Erreur de géocodage' }) // <-- Use Notify.create
      }
    },

    updatePreview() {
      if (this.newDestination.file) {
        this.newDestination.previewUrl = URL.createObjectURL(this.newDestination.file)
      }
    },

    async saveDestination() {
      if (!this.newDestination.coords.length) await this.geocodeLocation()
      if (!this.newDestination.coords.length) {
        Notify.create({ type: 'negative', message: 'Lieu introuvable' }) // <-- Use Notify.create
        return
      }
      const [lat, lng] = this.newDestination.coords
      const payload = {
        title: this.newDestination.title,
        type: this.newDestination.type,
        startTime: this.newDestination.startTime || null,
        endTime: this.newDestination.endTime || null,
        location: this.newDestination.location,
        notes: this.newDestination.notes,
        lat, lng
      }
      let recordId = this.originalId
      if (this.editMode) {
        const { error } = await supabase.from('destinations').update(payload).eq('id', recordId)
        if (error) return console.error('Update error:', error)
      } else {
        const { data, error } = await supabase.from('destinations').insert([payload]).select('id').single()
        if (error) return console.error('Insert error:', error)
        recordId = data.id
      }

      if (this.newDestination.file) {
        const fileName = `${recordId}`
        const { error: upErr } = await supabase.storage.from('products').upload(fileName, this.newDestination.file, { upsert: true })
        if (upErr) return console.error('Upload error:', upErr)
      }

      await this.fetchDestinations()
      this.dialogOpen = false
    }
  }
}
</script>

<style scoped>
.destinations-page { background:#f9fafa; min-height:100%; }
.page-header h1 { margin:0 0 24px; font-size:24px; color:#333; }
.cards-row { display:flex; gap:16px; margin-bottom:24px; }
.table-card { flex:1; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05); }
.section-row { display:flex; justify-content:flex-end; margin-bottom:24px; }
.map-full-container { width:100%; margin-bottom:24px; height:400px; }
.form-map-container { margin-top:16px; height:300px; }
.preview-img { width:100%; max-height:200px; border-radius:4px; object-fit:cover; }
::v-deep .form-map-container .leaflet-container,
::v-deep .map-full-container .leaflet-container { width:100%; height:100%; }
</style>
