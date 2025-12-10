export class YandexProvider {
  constructor() {
    this.endpoint = null
  }

  async search({ query }) {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.ymaps) {
        reject(new Error('Yandex Maps API not loaded'))
        return
      }

      window.ymaps.ready(() => {
        window.ymaps.geocode(query).then(
          (res) => {
            const geoObject = res.geoObjects.get(0)
            if (!geoObject) {
              resolve([])
              return
            }

            const coordinates = geoObject.geometry.getCoordinates()
            const bounds = geoObject.properties.get('boundedBy')

            const result = [{
              x: coordinates[1],
              y: coordinates[0],
              label: geoObject.properties.get('name') || query,
              bounds: bounds ? [
                [bounds[0][1], bounds[0][0]],
                [bounds[1][1], bounds[1][0]]
              ] : null,
              raw: geoObject
            }]

            resolve(result)
          },
          (err) => {
            console.error('Yandex geocoder error:', err)
            reject(err)
          }
        )
      })
    })
  }
}
