export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  ssr: false,

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      utm5BaseUrl: process.env.VITE_UTM5_BASE_URL || '',
      usBaseUrl: process.env.VITE_US_BASE_URL || ''
    }
  },

  app: {
    head: {
      title: 'Bitrix24 Map Widget',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
          integrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/@geoman-io/leaflet-geoman-free@latest/dist/leaflet-geoman.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
        }
      ]
    }
  },

  vite: {
    define: {
      'process.env.DEBUG': false
    },
    optimizeDeps: {
      include: ['leaflet']
    }
  }
})
