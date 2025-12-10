export const useUsersideApi = () => {
  const apiBaseUrl = ref('')

  const setApiUrl = (url) => {
    apiBaseUrl.value = url
  }

  const callApi = async (endpoint, auth, params = {}) => {
    try {
      const payload = {
        auth,
        ...params
      }

      const response = await fetch(`${apiBaseUrl.value}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Ошибка вызова Userside API:', error)
      throw error
    }
  }

  const getNodes = async (auth) => {
    return await callApi('/nodes', auth)
  }

  const getNode = async (auth, nodeId) => {
    return await callApi('/node', auth, { node_id: nodeId })
  }

  const getOpticalLines = async (auth) => {
    return await callApi('/optical-lines', auth)
  }

  const getOpticalLine = async (auth, lineId) => {
    return await callApi('/optical-line', auth, { line_id: lineId })
  }

  const getEquipment = async (auth, nodeId = null) => {
    const params = nodeId ? { node_id: nodeId } : {}
    return await callApi('/equipment', auth, params)
  }

  const searchAddress = async (auth, query) => {
    return await callApi('/address/search', auth, { query })
  }

  const getNodesByBounds = async (auth, bounds) => {
    return await callApi('/nodes/bounds', auth, {
      north: bounds.north,
      south: bounds.south,
      east: bounds.east,
      west: bounds.west
    })
  }

  const getLinesByBounds = async (auth, bounds) => {
    return await callApi('/lines/bounds', auth, {
      north: bounds.north,
      south: bounds.south,
      east: bounds.east,
      west: bounds.west
    })
  }

  return {
    setApiUrl,
    callApi,
    getNodes,
    getNode,
    getOpticalLines,
    getOpticalLine,
    getEquipment,
    searchAddress,
    getNodesByBounds,
    getLinesByBounds
  }
}
