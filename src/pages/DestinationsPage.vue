<template>
  <q-page padding class="destinations-page">
    <div class="page-header"><h1>Destinations</h1></div>

    <!-- Tableau des destinations -->
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
                alt="aperçu"
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

    <!-- Carte globale -->
    <div class="map-full-container">
      <LeafletMap :center="defaultCenter" :markers="allMarkers" />
    </div>

    <!-- Dialog formulaire -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width:400px; max-width:600px;">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Modifier' : 'Ajouter' }} une destination</div>
          <q-separator class="q-my-sm" />

          <q-input v-model="form.title" label="Titre" outlined dense class="q-mb-sm" />
          <q-select v-model="form.type" :options="destinationTypes" label="Type" outlined dense class="q-mb-sm" />
          <q-input v-model="form.startTime" label="Date de début" type="date" outlined dense class="q-mb-sm" />
          <q-input v-model="form.endTime" label="Date de fin" type="date" outlined dense class="q-mb-sm" />
          <q-input v-model="form.location" label="Lieu" outlined dense class="q-mb-sm" @blur="geocodeLocation" />

          <q-input v-model="form.notes" label="Notes" type="textarea" outlined dense class="q-mb-sm" />

          <div v-if="form.previewUrl" class="q-mb-sm">
            <img :src="form.previewUrl" alt="Aperçu image" class="preview-img" />
          </div>
          <q-file
            v-model="form.file"
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
          <q-btn flat :label="editMode ? 'Enregistrer' : 'Ajouter'" color="primary" @click="saveDestination" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { supabase } from 'src/boot/supabase'
import LeafletMap from 'components/LeafletMap.vue'

export default {
  name: 'DestinationsPage',
  components: { LeafletMap },
  data() {
    return {
      destinations: [],
      dialogOpen: false,
      editMode: false,
      originalId: null,
      defaultCenter: [48.8566, 2.3522],
      destinationTypes: [
        { label: 'Musée', value: 'musée' },
        { label: 'Spa', value: 'spa' },
        { label: 'Parc attraction', value: 'parc' },
        { label: 'Jeu pour enfant', value: 'jeu' },
        { label: 'Randonnée', value: 'randonnee' },
        { label: 'Spectacle', value: 'spectacle' }
      ],
      form: {
        title: '', type: '', startTime: '', endTime: '',
        location: '', notes: '', coords: [], file: null, previewUrl: ''
      },
      columns: [
        { name: 'title', label: 'Titre', field: row => row.title },
        { name: 'type', label: 'Type', field: row => row.type },
        { name: 'startTime', label: 'Début', field: row => row.startTime },
        { name: 'endTime', label: 'Fin', field: row => row.endTime },
        { name: 'location', label: 'Lieu', field: row => row.location },
        { name: 'notes', label: 'Notes', field: row => row.notes },
        { name: 'image', label: 'Image' },
        { name: 'actions', label: 'Actions' }
      ]
    }
  },
  computed: {
    allMarkers() {
      return this.destinations
        .filter(d => d.lat != null && d.lng != null)
        .map(d => ({ position: [d.lat, d.lng], popup: d.title }))
    },
    formCenter() {
      return this.form.coords.length ? this.form.coords : this.defaultCenter
    },
    formMarkers() {
      return this.form.coords.length
        ? [{ position: this.form.coords, popup: this.form.title }]
        : []
    }
  },
  mounted() {
    this.fetchDestinations()
  },
  methods: {
    async fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
      if (error) return console.error('Erreur fetch:', error)

      this.destinations = data.map(d => {
        const { publicUrl } = supabase.storage.from('products').getPublicUrl(`${d.id}`)
        return { ...d, image_url: publicUrl }
      })
    },

    openAddDestinationDialog() {
      this.editMode = false
      this.originalId = null
      this.form = {
        title: '', type: '', startTime: '', endTime: '',
        location: '', notes: '', coords: [], file: null, previewUrl: ''
      }
      this.dialogOpen = true
    },

    openEditDestinationDialog(dest) {
      this.editMode = true
      this.originalId = dest.id
      this.form = {
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
      if (error) return console.error('Erreur suppression:', error)
      this.fetchDestinations()
    },

    updatePreview() {
      if (this.form.file) {
        this.form.previewUrl = URL.createObjectURL(this.form.file)
      }
    },

    async geocodeLocation() {
      if (!this.form.location) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.form.location)}`)
        const data = await res.json()
        if (data.length) {
          this.form.coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        }
      } catch {
        alert("Erreur de géocodage")
      }
    },

    async saveDestination() {
      // Géocodage si nécessaire
      if (!this.form.coords.length) await this.geocodeLocation()
      if (!this.form.coords.length) {
        alert("Lieu introuvable")
        return
      }

      const [lat, lng] = this.form.coords
      const payload = {
        title: this.form.title,
        type: this.form.type,
        startTime: this.form.startTime || null,
        endTime: this.form.endTime || null,
        location: this.form.location,
        notes: this.form.notes,
        lat, lng
      }

      let recordId = this.originalId
      if (this.editMode) {
        const { error } = await supabase.from('destinations').update(payload).eq('id', recordId)
        if (error) return console.error('Erreur update:', error)
      } else {
        const { data, error } = await supabase.from('destinations').insert([payload]).select('id').single()
        if (error) return console.error('Erreur insert:', error)
        recordId = data.id
      }

      // Upload image si présente
      if (this.form.file) {
        const { error: uploadError } = await supabase
          .storage
          .from('products')
          .upload(`${recordId}`, this.form.file, { upsert: true })
        if (uploadError) console.error("Échec de l’upload de l’image")

        // Attendre 300ms pour que Supabase rende l'image accessible
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Rafraîchir la liste et fermer
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
