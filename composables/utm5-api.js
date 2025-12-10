export const useUtm5Api = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.utm5BaseUrl || import.meta.env.VITE_UTM5_BASE_URL

  const callApi = async (endpoint, auth, params = {}) => {
    try {
      const payload = {
        auth,
        ...params
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`UTM5 API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Ошибка вызова UTM5 API:', error)
      throw error
    }
  }

  const getCustomers = async (auth, filters = {}) => {
    return await callApi('/customers', auth, filters)
  }

  const getCustomer = async (auth, customerId) => {
    return await callApi('/customer', auth, { customer_id: customerId })
  }

  const getCustomersByAddress = async (auth, address) => {
    return await callApi('/customers/search', auth, { address })
  }

  const getCustomersByBounds = async (auth, bounds) => {
    return await callApi('/customers/bounds', auth, {
      north: bounds.north,
      south: bounds.south,
      east: bounds.east,
      west: bounds.west
    })
  }

  const getServices = async (auth, customerId = null) => {
    const params = customerId ? { customer_id: customerId } : {}
    return await callApi('/services', auth, params)
  }

  const getAccounts = async (auth, customerId = null) => {
    const params = customerId ? { customer_id: customerId } : {}
    return await callApi('/accounts', auth, params)
  }

  return {
    callApi,
    getCustomers,
    getCustomer,
    getCustomersByAddress,
    getCustomersByBounds,
    getServices,
    getAccounts
  }
}
