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

          <!-- Aperçu des images existantes -->
          <div v-if="form.existingImages && form.existingImages.length > 0" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Images existantes</div>
            <div class="existing-images-container">
              <div
                v-for="(imagePath, index) in form.existingImages"
                :key="index"
                class="image-item"
              >
                <img :src="getImageUrl(imagePath)" alt="Image existante" class="preview-img" />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  color="negative"
                  size="sm"
                  class="remove-image-btn"
                  @click="removeExistingImage(index)"
                />
              </div>
            </div>
          </div>

          <!-- Aperçu des nouvelles images -->
          <div v-if="form.previewUrls && form.previewUrls.length > 0" class="q-mb-sm">
            <div class="text-caption q-mb-xs">Nouvelles images</div>
            <div class="new-images-container">
              <div v-for="(previewUrl, index) in form.previewUrls" :key="index" class="image-item">
                <img :src="previewUrl" alt="Aperçu nouvelle image" class="preview-img" />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  color="negative"
                  size="sm"
                  class="remove-image-btn"
                  @click="removeNewImage(index)"
                />
              </div>
            </div>
          </div>

          <div class="image-upload-section q-mb-sm">
            <q-file
              v-model="form.files"
              label="Sélectionner des images"
              outlined
              dense
              class="q-mb-sm"
              accept="image/*"
              multiple
              @change="updatePreviews"
            />
            <q-btn
              v-if="form.files && form.files.length > 0"
              label="Ajouter les images"
              color="primary"
              icon="add"
              @click="addImagesImmediately"
              :loading="uploadingImages"
            />
          </div>

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
      uploadingImages: false,
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
        files: [],
        previewUrls: [],
        existingImages: [],
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
        { name: 'images', label: 'Images' },
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
        files: [],
        previewUrls: [],
        existingImages: [],
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
        files: [],
        previewUrls: [],
        existingImages: this.getImageArray(dest.image_path),
        category_id: dest.category_id || null,
      }
      this.dialogOpen = true
    },
    async deleteDestination(dest) {
      const { error } = await supabase.from('destinations').delete().eq('id', dest.id)
      if (error) return console.error('Erreur suppression:', error)
      this.fetchDestinations()
    },
    getImageArray(imagePath) {
      if (!imagePath) return []
      if (Array.isArray(imagePath)) return imagePath
      if (typeof imagePath === 'string') return [imagePath]
      return []
    },
    updatePreviews() {
      // Nettoyer les anciennes previews
      this.form.previewUrls.forEach((url) => URL.revokeObjectURL(url))
      this.form.previewUrls = []

      if (this.form.files && this.form.files.length > 0) {
        this.form.files.forEach((file) => {
          if (file) {
            this.form.previewUrls.push(URL.createObjectURL(file))
          }
        })
      }
    },
    removeExistingImage(index) {
      this.form.existingImages.splice(index, 1)
    },
    removeNewImage(index) {
      // Révocquer l'URL de l'objet
      URL.revokeObjectURL(this.form.previewUrls[index])
      this.form.previewUrls.splice(index, 1)
      this.form.files.splice(index, 1)
    },
    async addImagesImmediately() {
      if (!this.form.files || this.form.files.length === 0) return

      this.uploadingImages = true
      let uploadedPaths = []

      try {
        for (const file of this.form.files) {
          if (file) {
            const extension = file.name.split('.').pop()
            const uuid =
              window.crypto && window.crypto.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            const filePath = `${uuid}.${extension}`

            const { error: uploadError } = await supabase.storage
              .from('products')
              .upload(filePath, file, { upsert: true })

            if (uploadError) {
              console.error("Échec de l'upload de l'image", uploadError)
            } else {
              uploadedPaths.push(filePath)
              await new Promise((resolve) => setTimeout(resolve, 300))
            }
          }
        }

        // Ajouter les nouvelles images à la liste des images existantes
        this.form.existingImages.push(...uploadedPaths)

        // Nettoyer les fichiers et previews
        this.form.files = []
        this.form.previewUrls.forEach((url) => URL.revokeObjectURL(url))
        this.form.previewUrls = []

        // Si on est en mode édition, mettre à jour la destination en base
        if (this.editMode && this.originalId) {
          const payload = {
            image_path: this.form.existingImages,
          }
          const { error } = await supabase
            .from('destinations')
            .update(payload)
            .eq('id', this.originalId)
          if (error) {
            console.error('Erreur mise à jour images:', error)
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout des images:", error)
      } finally {
        this.uploadingImages = false
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
        image_path: this.form.existingImages.length > 0 ? this.form.existingImages : null,
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

      // Nettoyer les URLs d'aperçu
      this.form.previewUrls.forEach((url) => URL.revokeObjectURL(url))

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
.images-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.destination-image {
  height: 60px;
  width: 60px;
  border-radius: 4px;
  object-fit: cover;
}
.existing-images-container,
.new-images-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.image-item {
  position: relative;
  display: inline-block;
}
.preview-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}
.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.image-upload-section {
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 16px;
  background: #f9f9f9;
}
::v-deep .form-map-container .leaflet-container,
::v-deep .map-full-container .leaflet-container {
  width: 100%;
  height: 100%;
}
</style>
