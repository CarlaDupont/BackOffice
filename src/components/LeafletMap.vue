<template>
  <l-map
    :zoom="zoom"
    :center="center"
    style="width:100%; height:100%;"
  >
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    <l-marker
      v-for="(m, i) in markers"
      :key="i"
      :lat-lng="m.position"
    >
      <l-popup>{{ m.popup }}</l-popup>
    </l-marker>
  </l-map>
</template>

<script setup>
import { ref, watch } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  center: { type: Array, default: () => [48.8566, 2.3522] },
  markers: { type: Array, default: () => [] },
  zoom: { type: Number, default: 13 }
});

const center = ref(props.center);
const zoom = ref(props.zoom);

watch(() => props.center, val => { center.value = val; });
</script>

<style scoped>
.leaflet-container { border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
</style>
