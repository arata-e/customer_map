export const useCustomers = () => {
  const customers = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadCustomers = async (b24Instance) => {
    loading.value = true
    error.value = null

    try {
      const result = await b24Instance.callMethod('crm.deal.list', {
        select: ['ID', 'TITLE', 'UF_*'],
        filter: {}
      })

      customers.value = result.data?.items || []
      return customers.value
    } catch (err) {
      console.error('Ошибка загрузки клиентов:', err)
      error.value = err
      return []
    } finally {
      loading.value = false
    }
  }

  const getCustomerById = async (b24Instance, customerId) => {
    try {
      const result = await b24Instance.callMethod('crm.deal.get', {
        id: customerId
      })

      return result.data
    } catch (err) {
      console.error('Ошибка получения клиента:', err)
      throw err
    }
  }

  const createCustomer = async (b24Instance, customerData) => {
    try {
      const result = await b24Instance.callMethod('crm.deal.add', {
        fields: customerData
      })

      return result.data
    } catch (err) {
      console.error('Ошибка создания клиента:', err)
      throw err
    }
  }

  const updateCustomer = async (b24Instance, customerId, customerData) => {
    try {
      const result = await b24Instance.callMethod('crm.deal.update', {
        id: customerId,
        fields: customerData
      })

      return result.data
    } catch (err) {
      console.error('Ошибка обновления клиента:', err)
      throw err
    }
  }

  const filterCustomersByLocation = (customers, bounds) => {
    return customers.filter(customer => {
      if (!customer.latitude || !customer.longitude) return false

      const lat = parseFloat(customer.latitude)
      const lng = parseFloat(customer.longitude)

      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      )
    })
  }

  const getCustomersInRadius = (customers, center, radiusKm) => {
    return customers.filter(customer => {
      if (!customer.latitude || !customer.longitude) return false

      const distance = calculateDistance(
        center.lat,
        center.lng,
        parseFloat(customer.latitude),
        parseFloat(customer.longitude)
      )

      return distance <= radiusKm
    })
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRad = (value) => {
    return value * Math.PI / 180
  }

  return {
    customers,
    loading,
    error,
    loadCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    filterCustomersByLocation,
    getCustomersInRadius,
    calculateDistance
  }
}
