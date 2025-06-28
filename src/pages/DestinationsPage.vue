<template>
  <q-page padding class="destinations-page">
    <div class="page-header"><h1>Destinations</h1></div>

    <!-- Actions principales -->
    <div class="section-row justify-between">
      <q-btn label="Gérer les catégories" color="secondary" @click="dialogManageCategories = true" />
      <q-btn label="Ajouter une destination" color="primary" @click="openAddDestinationDialog" />
    </div>

    <!-- Tableau des destinations -->
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
          <!-- Colonne images -->
          <template v-slot:body-cell-images="props">
            <q-td>
              <div class="images-container">
                <img
                  v-for="(imagePath, index) in getImageArray(props.row.image_path)"
                  :key="index"
                  :src="getImageUrl(imagePath)"
                  alt="aperçu"
                  class="destination-image"
                />
              </div>
            </q-td>
          </template>

          <!-- Colonne actions -->
          <template v-slot:body-cell-actions="props">
            <q-td align="right">
              <q-btn dense flat icon="edit" color="primary" @click="openEditDestinationDialog(props.row)" />
              <q-btn dense flat icon="delete" color="negative" @click="deleteDestination(props.row)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Carte -->
    <div class="map-full-container">
      <LeafletMap :center="defaultCenter" :markers="allMarkers" />
    </div>

    <!-- Dialog ajout / édition destination -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 400px; max-width: 600px" >
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
            outlined dense
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
            outlined dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.location"
            label="Lieu"
            outlined dense
            class="q-mb-sm"
            @blur="geocodeLocation"
          />
          <q-input
            v-model="form.notes"
            label="Notes"
            type="textarea"
            outlined dense
            class="q-mb-sm"
          />

          <!-- Aperçu images existantes -->
          <div v-if="form.existingImages.length" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Images existantes</div>
            <div class="existing-images-container">
              <div v-for="(img, idx) in form.existingImages" :key="idx" class="image-item">
                <img :src="getImageUrl(img)" class="preview-img" />
                <q-btn flat round dense icon="close" color="negative" size="sm"
                       class="remove-image-btn"
                       @click="removeExistingImage(idx)" />
              </div>
            </div>
          </div>

          <!-- Upload et preview nouveaux fichiers -->
          <q-file
            v-model="form.files"
            label="Sélectionner des images"
            outlined dense
            accept="image/*"
            multiple
            @change="updatePreviews"
            class="q-mb-sm"
          />
          <div v-if="form.previewUrls.length" class="new-images-container q-mb-sm">
            <div v-for="(url, idx) in form.previewUrls" :key="idx" class="image-item">
              <img :src="url" class="preview-img" />
              <q-btn flat round dense icon="close" color="negative" size="sm"
                     class="remove-image-btn"
                     @click="removeNewImage(idx)" />
            </div>
          </div>
          <q-btn
            v-if="form.files.length"
            label="Ajouter les images immédiatement"
            color="primary"
            icon="add"
            @click="addImagesImmediately"
            :loading="uploadingImages"
            class="q-mb-sm"
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

    <!-- Dialog CRUD catégories -->
    <q-dialog v-model="dialogManageCategories" persistent>
  <q-card
    style="
      width: 600px;
      height: 80vh;
      display: flex;
      flex-direction: column;
    "
  >
    <!-- En-tête -->
    <q-card-section class="text-h6">
      Gestion des catégories
    </q-card-section>
    <q-separator />

    <!-- Tableau scrollable -->
    <q-card-section
      style="
        flex: 1;
        padding: 0;
        overflow-y: auto;
      "
    >
      <q-table
        :rows="categories"
        :columns="categoryColumns"
        row-key="id"
        flat dense hide-bottom
      >
        <template v-slot:body-cell-actions="props">
          <q-td>
            <q-btn flat dense icon="edit" color="primary"
              @click="editCategory(props.row)" />
            <q-btn flat dense icon="delete" color="negative"
              @click="deleteCategory(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card-section>

    <q-separator />

    <!-- Formulaire -->
    <q-card-section>
      <q-input
        v-model="categoryForm.name"
        label="Ajouter / Modifier une catégorie"
        outlined dense
        :rules="[v => !!v || 'Le nom est requis']"
      />
    </q-card-section>

    <!-- Actions -->
    <q-card-actions align="right">
      <q-btn flat label="Annuler" @click="closeCategoryDialog" />
      <q-btn flat label="Enregistrer" color="primary" @click="saveCategory" />
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
      // Destinations
      destinations: [],
      defaultCenter: [48.8566, 2.3522],
      destinationTypes: [
        { label: 'Musée', value: 'musée' },
        { label: 'Spa', value: 'spa' },
        { label: 'Parc attraction', value: 'parc' },
        { label: 'Jeu pour enfant', value: 'jeu' },
        { label: 'Randonnée', value: 'randonnee' },
        { label: 'Spectacle', value: 'spectacle' }
      ],
      dialogOpen: false,
      editMode: false,
      originalId: null,
      uploadingImages: false,
      form: {
        title: '',
        type: '',
        location: '',
        notes: '',
        coords: [],
        files: [],
        previewUrls: [],
        existingImages: [],
        category_id: null
      },

      // Catégories
      categories: [],
      dialogManageCategories: false,
      categoryForm: { id: null, name: '' },

      // Colonnes
      columns: [
        { name: 'title', label: 'Titre', field: row => row.title },
        { name: 'type', label: 'Type', field: 'type' },
        { name: 'category', label: 'Catégorie', field: row => row.category?.name || '—' },
        { name: 'location', label: 'Lieu', field: row => row.location },
        { name: 'notes', label: 'Notes', field: row => row.notes },
        { name: 'images', label: 'Images' },
        { name: 'actions', label: 'Actions' }
      ],
      categoryColumns: [
        { name: 'name', label: 'Nom', field: 'name' },
        { name: 'actions', label: 'Actions', field: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    // Markers pour la carte principale
    allMarkers() {
      return this.destinations
        .filter(d => d.lat != null && d.lng != null)
        .map(d => ({ position: [d.lat, d.lng], popup: d.title }))
    },
    // Centre et marqueurs pour le form
    formCenter() {
      return this.form.coords.length ? this.form.coords : this.defaultCenter
    },
    formMarkers() {
      return this.form.coords.length ? [{ position: this.form.coords, popup: this.form.title }] : []
    }
  },
  mounted() {
    this.fetchDestinations()
    this.fetchCategories()
  },
  methods: {
    // ----- Destinations -----
    async fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('*, category:categories(id, name)')
      if (error) console.error(error)
      else this.destinations = data
    },
    openAddDestinationDialog() {
      this.editMode = false
      this.originalId = null
      this.form = {
        title: '', type: '', location: '',
        notes: '', coords: [], files: [],
        previewUrls: [], existingImages: [],
        category_id: null
      }
      this.dialogOpen = true
    },
    openEditDestinationDialog(dest) {
      this.editMode = true
      this.originalId = dest.id
      this.form = {
        title: dest.title,
        type: dest.type,
        location: dest.location,
        notes: dest.notes,
        coords: [dest.lat, dest.lng],
        files: [],
        previewUrls: [],
        existingImages: this.getImageArray(dest.image_path),
        category_id: dest.category_id
      }
      this.dialogOpen = true
    },
    async saveDestination() {
      // géocodage si nécessaire
      if (!this.form.coords.length) await this.geocodeLocation()
      if (!this.form.coords.length) { alert('Lieu introuvable'); return }

      const [lat, lng] = this.form.coords
      const payload = {
        title: this.form.title,
        type: this.form.type,
        location: this.form.location,
        notes: this.form.notes,
        lat, lng,
        category_id: this.form.category_id,
        image_path: this.form.existingImages.length ? this.form.existingImages : null
      }

      if (this.editMode) {
        await supabase.from('destinations').update(payload).eq('id', this.originalId)
      } else {
        await supabase.from('destinations').insert([payload])
      }

      this.dialogOpen = false
      this.fetchDestinations()
    },
    async deleteDestination(dest) {
      if (!confirm('Supprimer cette destination ?')) return
      await supabase.from('destinations').delete().eq('id', dest.id)
      this.fetchDestinations()
    },
    getImageArray(path) {
      if (!path) return []
      if (Array.isArray(path)) return path
      return [path]
    },
    getImageUrl(path) {
      if (!path) return ''
      return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
    },
    updatePreviews() {
      this.form.previewUrls.forEach(u => URL.revokeObjectURL(u))
      this.form.previewUrls = this.form.files.map(f => URL.createObjectURL(f))
    },
    removeExistingImage(i) { this.form.existingImages.splice(i,1) },
    removeNewImage(i) {
      URL.revokeObjectURL(this.form.previewUrls[i])
      this.form.previewUrls.splice(i,1)
      this.form.files.splice(i,1)
    },
    async addImagesImmediately() {
      this.uploadingImages = true
      const uploaded = []
      for (let file of this.form.files) {
        const ext = file.name.split('.').pop()
        const key = `${crypto.randomUUID()}.${ext}`
        await supabase.storage.from('products').upload(key, file, { upsert: true })
        uploaded.push(key)
      }
      this.form.existingImages.push(...uploaded)
      this.form.files = []
      this.form.previewUrls.forEach(u=>URL.revokeObjectURL(u))
      this.form.previewUrls = []
      if (this.editMode) {
        await supabase.from('destinations').update({ image_path: this.form.existingImages }).eq('id', this.originalId)
      }
      this.uploadingImages = false
    },
    async geocodeLocation() {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.form.location)}`)
      const json = await res.json()
      if (json.length) this.form.coords = [parseFloat(json[0].lat), parseFloat(json[0].lon)]
    },

    // ----- Catégories CRUD -----
    async fetchCategories() {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) console.error(error)
      else this.categories = data
    },
    openEditCategoryDialog(row) {
      this.categoryForm = { id: row.id, name: row.name }
      this.dialogManageCategories = true
    },
    closeCategoryDialog() {
      this.categoryForm = { id: null, name: '' }
      this.dialogManageCategories = false
    },
    async saveCategory() {
      if (!this.categoryForm.name.trim()) return
      if (this.categoryForm.id) {
        await supabase.from('categories').update({ name: this.categoryForm.name }).eq('id', this.categoryForm.id)
      } else {
        await supabase.from('categories').insert({ name: this.categoryForm.name })
      }
      this.fetchCategories()
      this.closeCategoryDialog()
    },
    async deleteCategory(id) {
      if (!confirm('Supprimer cette catégorie ?')) return
      await supabase.from('categories').delete().eq('id', id)
      this.fetchCategories()
    }
  }
}
</script>

<style scoped>
.destinations-page { background: #f9fafa; min-height: 100%; }
.page-header h1 { margin: 0 0 24px; font-size: 24px; color: #333; }
.section-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
.cards-row { display: flex; margin-bottom: 24px; }
.table-card { flex: 1; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.images-container { display: flex; gap: 8px; flex-wrap: wrap; }
.destination-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.map-full-container { width: 100%; height: 400px; margin-bottom: 24px; }
.form-map-container { height: 300px; margin-bottom: 16px; }
.image-item { position: relative; display: inline-block; }
.preview-img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; }
.remove-image-btn { position: absolute; top: -8px; right: -8px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.new-images-container, .existing-images-container { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
