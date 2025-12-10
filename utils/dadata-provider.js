export class DaDataProvider {
  constructor(token) {
    this.endpoint = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
    this.token = token
  }

  async search({ query }) {
    if (!query || query.length < 3) {
      return []
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.token}`
        },
        body: JSON.stringify({
          query: query,
          count: 10
        })
      })

      if (!response.ok) {
        console.error('DaData API error:', response.status)
        return []
      }

      const data = await response.json()

      if (!data.suggestions || data.suggestions.length === 0) {
        return []
      }

      const results = data.suggestions
        .filter(suggestion => suggestion.data.geo_lat && suggestion.data.geo_lon)
        .map(suggestion => ({
          x: parseFloat(suggestion.data.geo_lon),
          y: parseFloat(suggestion.data.geo_lat),
          label: suggestion.value,
          bounds: null,
          raw: suggestion
        }))

      return results
    } catch (error) {
      console.error('DaData search error:', error)
      return []
    }
  }
}
