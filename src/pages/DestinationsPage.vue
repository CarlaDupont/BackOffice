
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
          <!-- Colonne Promo -->
          <template v-slot:body-cell-promo="props">
            <q-td align="center">{{ ((1 - props.row.promo) * 100).toFixed(0) }}%</q-td>
          </template>
          <!-- Colonne Titre -->
          <template v-slot:body-cell-title="props">
            <q-td align="left">{{ props.row.title }}</q-td>
          </template>
          <!-- Colonne Catégorie -->
          <template v-slot:body-cell-category="props">
            <q-td align="left">{{ props.row.category?.name || '—' }}</q-td>
          </template>
          <!-- Colonne Lieu -->
          <template v-slot:body-cell-location="props">
            <q-td align="left">{{ props.row.location }}</q-td>
          </template>
          <!-- Colonne Notes -->
          <template v-slot:body-cell-notes="props">
            <q-td align="left">{{ props.row.notes }}</q-td>
          </template>
          <!-- Colonne Images -->
          <template v-slot:body-cell-images="props">
            <q-td align="center">
              <div class="images-container">
                <img
                  v-for="(img, i) in getImageArray(props.row.image_path)"
                  :key="i"
                  :src="getImageUrl(img)"
                  alt="aperçu"
                  class="destination-image"
                />
              </div>
            </q-td>
          </template>
          <!-- Colonne Actions -->
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

    <!-- Dialog Ajout/Édition Destination -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Modifier' : 'Ajouter' }} une destination</div>
          <q-separator class="q-my-sm" />

          <q-input v-model="form.title" label="Titre" outlined dense class="q-mb-sm" />
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

          <!-- Champ Promo -->
          <q-input
            v-model.number="form.discountPercent"
            label="Réduction (%)"
            type="number"
            min="0"
            max="100"
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

          <!-- Images existantes -->
          <div v-if="form.existingImages.length" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Images existantes</div>
            <div class="existing-images-container">
              <div v-for="(img, idx) in form.existingImages" :key="idx" class="image-item">
                <img :src="getImageUrl(img)" class="preview-img" alt="aperçu" />
                <q-btn flat round dense icon="close" color="negative" size="sm"
                  class="remove-image-btn" @click="removeExistingImage(idx)" />
              </div>
            </div>
          </div>

          <!-- Upload Nouvelles Images -->
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
              <img :src="url" class="preview-img" alt="aperçu" />
              <q-btn flat round dense icon="close" color="negative" size="sm"
                class="remove-image-btn" @click="removeNewImage(idx)" />
            </div>
          </div>
          <q-btn
            v-if="form.files.length"
            label="Ajouter les images"
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

    <!-- Dialog Gestion Catégories -->
    <q-dialog v-model="dialogManageCategories" persistent full-height>
      <q-card style="width: 80vw; max-width: 800px; height: 80vh; display: flex; flex-direction: column;">
        <q-card-section class="text-h6">Gestion des catégories</q-card-section>
        <q-separator />
        <q-card-section style="flex: 1; padding: 0; overflow-y: auto;">
          <q-table
            :rows="categories"
            :columns="categoryColumns"
            row-key="id"
            flat dense
            :rows-per-page-options="[categories.length]"
            :rows-per-page="categories.length"
            hide-bottom
          >
            <template v-slot:body-cell-image="props">
              <q-td align="center">
                <img v-if="props.row.existingImage" :src="getImageUrl(props.row.existingImage)" class="category-image" alt="Catégorie" />
              </q-td>
            </template>
            <template v-slot:body-cell-name="props">
              <q-td align="left">{{ props.row.name }}</q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td align="right">
                <q-btn flat dense icon="edit" color="primary" @click="editCategory(props.row)" />
                <q-btn flat dense icon="delete" color="negative" @click="deleteCategory(props.row.id)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-input
            v-model="categoryForm.name"
            label="Nom de la catégorie"
            outlined dense
            :rules="[v => !!v || 'Le nom est requis']"
            class="q-mb-md"
          />
          <div v-if="categoryForm.existingImage" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Image actuelle</div>
            <img :src="getImageUrl(categoryForm.existingImage)" class="preview-img" alt="aperçu" />
          </div>
          <q-file
            v-model="categoryForm.file"
            label="Sélectionner une image"
            accept="image/*"
            outlined dense
            @change="updateCategoryPreview"
          />
          <div v-if="categoryForm.previewUrl" class="q-mt-sm">
            <div class="text-caption q-mb-xs">Aperçu</div>
            <img :src="categoryForm.previewUrl" class="preview-img" alt="aperçu" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" @click="closeCategoryDialog" />
          <q-btn flat label="Enregistrer"	color="primary" @click="saveCategory" />
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
      defaultCenter: [48.8566, 2.3522],
      dialogOpen: false,
      editMode: false,
      originalId: null,
      uploadingImages: false,
      form: {
        title: '',
        location: '',
        notes: '',
        coords: [],
        files: [],
        previewUrls: [],
        existingImages: [],
        category_id: null,
        discountPercent: 0
      },
      categories: [],
      dialogManageCategories: false,
      categoryForm: { id: null, name: '', existingImage: null, file: null, previewUrl: '' },
      columns: [
        { name: 'images', label: 'Images', align: 'center' },
        { name: 'title', label: 'Titre', align: 'left', field: row => row.title },
        { name: 'promo', label: 'Promo', align: 'center', field: row => `${((1 - row.promo) * 100).toFixed(0)}%` },
        { name: 'category', label: 'Catégorie', align: 'left', field: row => row.category?.name || '—' },
        { name: 'location', label: 'Lieu', align: 'left', field: row => row.location },
        { name: 'notes', label: 'Notes', align: 'left', field: row => row.notes },
        { name: 'actions', label: 'Actions', align: 'right' }
      ],
      categoryColumns: [
        { name: 'image', label: 'Image', align: 'center', field: 'image', sortable: false },
        { name: 'name', label: 'Nom', align: 'left', field: 'name' },
        { name: 'actions', label: 'Actions', align: 'right', field: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    allMarkers() {
      return this.destinations
        .filter(d => d.lat != null && d.lng != null)
        .map(d => ({ position: [d.lat, d.lng], popup: d.title }))
    },
    formCenter() { return this.form.coords.length ? this.form.coords : this.defaultCenter },
    formMarkers() { return this.form.coords.length ? [{ position: this.form.coords, popup: this.form.title }] : [] }
  },
  mounted() {
    this.fetchDestinations()
    this.fetchCategories()
  },
  methods: {
    async fetchDestinations() {
      const { data, error } = await supabase.from('destinations').select('*, category:categories(id,name), promo')
      if (error) console.error(error)
      else this.destinations = data
    },
    openAddDestinationDialog() {
      this.editMode = false
      this.originalId = null
      Object.assign(this.form, { title: '', location: '', notes: '', coords: [], files: [], previewUrls: [], existingImages: [], category_id: null, discountPercent: 0 })
      this.dialogOpen = true
    },
    openEditDestinationDialog(dest) {
      this.editMode = true
      this.originalId = dest.id
      Object.assign(this.form, {
        title: dest.title,
        location: dest.location,
        notes: dest.notes,
        coords: [dest.lat, dest.lng],
        files: [],
        previewUrls: [],
        existingImages: this.getImageArray(dest.image_path),
        category_id: dest.category_id,
        discountPercent: ((1 - (dest.promo ?? 1)) * 100)
      })
      this.dialogOpen = true
    },
    async saveDestination() {
      if (!this.form.coords.length) await this.geocodeLocation()
      if (!this.form.coords.length) { alert('Lieu introuvable'); return }
      const [lat, lng] = this.form.coords
      const promoCoeff = 1 - (this.form.discountPercent / 100)
      const payload = {
        title: this.form.title,
        location: this.form.location,
        notes: this.form.notes,
        lat,
        lng,
        category_id: this.form.category_id,
        image_path: this.form.existingImages.length ? this.form.existingImages : null,
        promo: promoCoeff
      }
      if (this.editMode) await supabase.from('destinations').update(payload).eq('id', this.originalId)
      else await supabase.from('destinations').insert([payload])
      this.dialogOpen = false
      this.fetchDestinations()
    },
    async deleteDestination(dest) {
      if (!confirm('Supprimer cette destination ?')) return
      await supabase.from('destinations').delete().eq('id', dest.id)
      this.fetchDestinations()
    },
    getImageArray(path) { if (!path) return []; return Array.isArray(path) ? path : [path] },
    getImageUrl(path) { return path ? supabase.storage.from('products').getPublicUrl(path).data.publicUrl : '' },
    updatePreviews() { this.form.previewUrls.forEach(u => URL.revokeObjectURL(u)); this.form.previewUrls = this.form.files.map(f => URL.createObjectURL(f)) },
    removeExistingImage(i) { this.form.existingImages.splice(i, 1) },
    removeNewImage(i) { URL.revokeObjectURL(this.form.previewUrls[i]); this.form.previewUrls.splice(i, 1); this.form.files.splice(i, 1) },
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
      this.form.previewUrls.forEach(u => URL.revokeObjectURL(u))
      this.form.previewUrls = []
      if (this.editMode) await supabase.from('destinations').update({ image_path: this.form.existingImages }).eq('id', this.originalId)
      this.uploadingImages = false
    },
    async geocodeLocation() {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.form.location)}`)
      const json = await res.json()
      if (json.length) this.form.coords = [parseFloat(json[0].lat), parseFloat(json[0].lon)]
    },
    async fetchCategories() {
      const { data, error } = await supabase.from('categories').select('id,name,image_path').order('name')
      if (error) console.error(error)
      else this.categories = data.map(cat => ({ ...cat, existingImage: cat.image_path }))
    },
    updateCategoryPreview() {
      if (this.categoryForm.previewUrl) URL.revokeObjectURL(this.categoryForm.previewUrl)
      this.categoryForm.previewUrl = this.categoryForm.file ? URL.createObjectURL(this.categoryForm.file) : ''
    },
    editCategory(row) {
      this.categoryForm = { id: row.id, name: row.name, existingImage: row.existingImage, file: null, previewUrl: '' }
      this.dialogManageCategories = true
    },
    closeCategoryDialog() {
      this.categoryForm = { id: null, name: '', existingImage: null, file: null, previewUrl: '' }
      this.dialogManageCategories = false
    },
    async saveCategory() {
      if (!this.categoryForm.name.trim()) return
      let imagePath = this.categoryForm.existingImage
      if (this.categoryForm.file) {
        const file = this.categoryForm.file
        const ext = file.name.split('.').pop()
        const key = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('products').upload(key, file, { upsert: true })
        if (uploadError) { console.error(uploadError); return }
        imagePath = key
      }
      const payload = { name: this.categoryForm.name, image_path: imagePath }
      if (this.categoryForm.id) await supabase.from('categories').update(payload).eq('id', this.categoryForm.id)
      else await supabase.from('categories').insert([payload])
      this.fetchCategories(); this.closeCategoryDialog()
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
.category-image { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
</style>
