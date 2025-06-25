<template>
  <q-page padding class="destinations-page">
    <div class="page-header"><h1>Destinations</h1></div>

    <div class="section-row justify-between">
      <q-btn label="Ajouter une catégorie" color="secondary" @click="dialogAddCategory = true" />
      <q-btn label="Ajouter une destination" color="primary" @click="openAddDestinationDialog" />
    </div>

    <div class="cards-row">
      <div class="table-card">
        <q-table
          :rows="destinations"
          :columns="columns"
          :rows-per-page-options="[5, 10, 15]"
          flat
          dense
          row-key="id"
        >
          <template v-slot:body-cell-image="props">
            <q-td>
              <img
                v-if="getImageUrl(props.row.image_path)"
                :src="getImageUrl(props.row.image_path)"
                alt="aperçu"
                style="height: 60px; border-radius: 4px; object-fit: cover"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td>
              <q-btn
                dense
                flat
                icon="edit"
                color="primary"
                @click="openEditDestinationDialog(props.row)"
              />
              <q-btn
                dense
                flat
                icon="delete"
                color="negative"
                @click="deleteDestination(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <div class="map-full-container">
      <LeafletMap :center="defaultCenter" :markers="allMarkers" />
    </div>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Modifier' : 'Ajouter' }} une destination</div>
          <q-separator class="q-my-sm" />

          <q-input v-model="form.title" label="Titre" outlined dense class="q-mb-sm" />
          <q-select
            v-model="form.type"
            :options="destinationTypes"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Type"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="form.category_id"
            :options="categories"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            label="Catégorie"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.startTime"
            label="Date de début"
            type="date"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.endTime"
            label="Date de fin"
            type="date"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.location"
            label="Lieu"
            outlined
            dense
            class="q-mb-sm"
            @blur="geocodeLocation"
          />
          <q-input
            v-model="form.notes"
            label="Notes"
            type="textarea"
            outlined
            dense
            class="q-mb-sm"
          />

          <div v-if="form.previewUrl" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Aperçu de l'image</div>
            <img :src="form.previewUrl" alt="Aperçu image" class="preview-img" />
          </div>
          <q-file
            v-model="form.file"
            label="Image du lieu"
            outlined
            dense
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
          <q-btn
            flat
            :label="editMode ? 'Enregistrer' : 'Ajouter'"
            color="primary"
            @click="saveDestination"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogAddCategory" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Nouvelle catégorie</div>
          <q-input
            v-model="newCategoryName"
            label="Nom de la catégorie"
            outlined
            dense
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" @click="dialogAddCategory = false" />
          <q-btn flat label="Ajouter" color="primary" @click="addCategory" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogAddCategory" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Nouvelle catégorie</div>
          <q-input
            v-model="newCategoryName"
            label="Nom de la catégorie"
            outlined
            dense
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" @click="dialogAddCategory = false" />
          <q-btn flat label="Ajouter" color="primary" @click="addCategory" />
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
      categories: [],
      dialogOpen: false,
      dialogAddCategory: false,
      newCategoryName: '',
      editMode: false,
      originalId: null,
      defaultCenter: [48.8566, 2.3522],
      destinationTypes: [
        { label: 'Musée', value: 'musée' },
        { label: 'Spa', value: 'spa' },
        { label: 'Parc attraction', value: 'parc' },
        { label: 'Jeu pour enfant', value: 'jeu' },
        { label: 'Randonnée', value: 'randonnee' },
        { label: 'Spectacle', value: 'spectacle' },
      ],
      form: {
        title: '',
        type: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: '',
        coords: [],
        file: null,
        previewUrl: '',
        category_id: null,
      },
      columns: [
        { name: 'title', label: 'Titre', field: (row) => row.title },
        { name: 'type', label: 'Type', field: 'type' },
        { name: 'category', label: 'Catégorie', field: (row) => row.category?.name || '—' },
        { name: 'startTime', label: 'Début', field: (row) => row.startTime },
        { name: 'endTime', label: 'Fin', field: (row) => row.endTime },
        { name: 'location', label: 'Lieu', field: (row) => row.location },
        { name: 'notes', label: 'Notes', field: (row) => row.notes },
        { name: 'image', label: 'Image' },
        { name: 'actions', label: 'Actions' },
      ],
    }
  },
  computed: {
    allMarkers() {
      return this.destinations
        .filter((d) => d.lat != null && d.lng != null)
        .map((d) => ({ position: [d.lat, d.lng], popup: d.title }))
    },
    formCenter() {
      return this.form.coords.length ? this.form.coords : this.defaultCenter
    },
    formMarkers() {
      return this.form.coords.length ? [{ position: this.form.coords, popup: this.form.title }] : []
    },
  },
  mounted() {
    this.fetchDestinations()
    this.fetchCategories()
  },
  methods: {
    async fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('*, category:categories(id, name)')
      if (error) return console.error('Erreur fetch destinations:', error)
      this.destinations = data
    },
    async fetchCategories() {
      const { data, error } = await supabase.from('categories').select('*')
      if (error) return console.error('Erreur fetch catégories:', error)
      this.categories = data
    },
    async addCategory() {
      if (!this.newCategoryName.trim()) return

      const { error } = await supabase
        .from('categories')
        .insert({ name: this.newCategoryName.trim() })
      if (error) return console.error('Erreur ajout catégorie:', error)

      this.newCategoryName = ''
      this.dialogAddCategory = false
      this.fetchCategories()
    },
    openAddDestinationDialog() {
      this.editMode = false
      this.originalId = null
      this.form = {
        title: '',
        type: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: '',
        coords: [],
        file: null,
        previewUrl: '',
        category_id: null,
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
        previewUrl: this.getImageUrl(dest.image_path),
        category_id: dest.category_id || null,
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
        const file = Array.isArray(this.form.file) ? this.form.file[0] : this.form.file
        this.form.previewUrl = URL.createObjectURL(file)
      } else if (this.editMode && this.originalId) {
        this.form.previewUrl = this.getImageUrl(
          this.originalId,
          this.destinations.find((d) => d.id === this.originalId).image_path,
        )
      } else {
        this.form.previewUrl = ''
      }
    },
    async geocodeLocation() {
      if (!this.form.location) return
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.form.location)}`,
        )
        const data = await res.json()
        if (data.length) {
          this.form.coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        }
      } catch {
        alert('Erreur de géocodage')
      }
    },
    async saveDestination() {
      if (!this.form.coords.length) await this.geocodeLocation()
      if (!this.form.coords.length) {
        alert('Lieu introuvable')
        return
      }

      const [lat, lng] = this.form.coords
      let imagePath = null

      if (this.form.file) {
        const extension = this.form.file.name.split('.').pop()
        const uuid =
          window.crypto && window.crypto.randomUUID
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        const filePath = `${uuid}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, this.form.file, { upsert: true })

        if (uploadError) {
          console.error('Échec de l’upload de l’image', uploadError)
        } else {
          imagePath = filePath
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      const payload = {
        title: this.form.title,
        type: this.form.type,
        startTime: this.form.startTime || null,
        endTime: this.form.endTime || null,
        location: this.form.location,
        notes: this.form.notes,
        lat,
        lng,
        category_id: this.form.category_id,
        image_path:
          imagePath ||
          (this.editMode
            ? this.destinations.find((d) => d.id === this.originalId)?.image_path
            : null),
      }

      let recordId = this.originalId
      if (this.editMode) {
        const { error } = await supabase.from('destinations').update(payload).eq('id', recordId)
        if (error) return console.error('Erreur update:', error)
      } else {
        const { data, error } = await supabase
          .from('destinations')
          .insert([payload])
          .select('id')
          .single()
        if (error) return console.error('Erreur insert:', error)
        recordId = data.id
      }

      // Rafraîchir la liste et fermer
      await this.fetchDestinations()
      this.dialogOpen = false
    },
    getImageUrl(imagePath) {
      if (!imagePath) return ''
      const { data, error } = supabase.storage.from('products').getPublicUrl(imagePath)
      if (error) {
        console.error(error)
        return ''
      }
      return data.publicUrl
    },
  },
}
</script>

<style scoped>
.destinations-page {
  background: #f9fafa;
  min-height: 100%;
}
.page-header h1 {
  margin: 0 0 24px;
  font-size: 24px;
  color: #333;
}
.cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.table-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.section-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}
.map-full-container {
  width: 100%;
  margin-bottom: 24px;
  height: 400px;
}
.form-map-container {
  margin-top: 16px;
  height: 300px;
}
.preview-img {
  width: 100%;
  max-height: 200px;
  border-radius: 4px;
  object-fit: cover;
}
::v-deep .form-map-container .leaflet-container,
::v-deep .map-full-container .leaflet-container {
  width: 100%;
  height: 100%;
}
</style>
