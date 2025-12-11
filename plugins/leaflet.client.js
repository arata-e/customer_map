import L from 'leaflet'
import 'leaflet.markercluster'
import '@geoman-io/leaflet-geoman-free'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      leaflet: L
    }
  }
})
