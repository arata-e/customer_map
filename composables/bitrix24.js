export const useBitrix24 = () => {
  const SMART_PROCESS_ID = 139
  const POLYGON_TYPE_ID = 61
  const POINT_TYPE_ID = 65

  const getGeoObjects = async (b24Instance, typeId = null) => {
    try {
      const params = {
        entityTypeId: SMART_PROCESS_ID,
        select: ['*', 'UF_*'],
        filter: typeId ? { categoryId: typeId } : {}
      }

      const result = await b24Instance.callMethod('crm.item.list', params)
      return result.data?.items || []
    } catch (error) {
      console.error('Ошибка получения геообъектов:', error)
      return []
    }
  }

  const getStages = async (b24Instance, categoryId) => {
    try {
      const params = {
        entityTypeId: SMART_PROCESS_ID,
        id: categoryId
      }

      const result = await b24Instance.callMethod('crm.status.list', {
        filter: { ENTITY_ID: `DYNAMIC_${SMART_PROCESS_ID}_STAGE_${categoryId}` }
      })
      return result.data?.statuses || []
    } catch (error) {
      console.error('Ошибка получения стадий:', error)
      return []
    }
  }

  const getPolygons = async (b24Instance) => {
    return await getGeoObjects(b24Instance, POLYGON_TYPE_ID)
  }

  const getPoints = async (b24Instance) => {
    return await getGeoObjects(b24Instance, POINT_TYPE_ID)
  }

  const createGeoObject = async (b24Instance, data, typeId) => {
    try {
      const params = {
        entityTypeId: SMART_PROCESS_ID,
        fields: {
          categoryId: typeId,
          ...data
        }
      }

      const result = await b24Instance.callMethod('crm.item.add', params)
      return result.data
    } catch (error) {
      console.error('Ошибка создания геообъекта:', error)
      throw error
    }
  }

  const updateGeoObject = async (b24Instance, id, data) => {
    try {
      const params = {
        entityTypeId: SMART_PROCESS_ID,
        id: id,
        fields: data
      }

      const result = await b24Instance.callMethod('crm.item.update', params)
      return result.data
    } catch (error) {
      console.error('Ошибка обновления геообъекта:', error)
      throw error
    }
  }

  const deleteGeoObject = async (b24Instance, id) => {
    try {
      const params = {
        entityTypeId: SMART_PROCESS_ID,
        id: id
      }

      const result = await b24Instance.callMethod('crm.item.delete', params)
      return result.data
    } catch (error) {
      console.error('Ошибка удаления геообъекта:', error)
      throw error
    }
  }

  const openEntityCard = async (b24Instance, entityTypeId, entityId) => {
    try {
      await b24Instance.callMethod('BX24.openPath', {
        path: `/crm/type/${entityTypeId}/details/${entityId}/`
      })
    } catch (error) {
      console.error('Ошибка открытия карточки:', error)
    }
  }

  const getAuthData = (b24Instance) => {
    if (!b24Instance) return null

    const auth = b24Instance.auth.getAuthData()
    return {
      domain: auth.domain || '',
      member_id: auth.member_id || '',
      access_token: auth.access_token || '',
      refresh_token: auth.refresh_token || '',
      expires_in: auth.expires_in || 0
    }
  }

  return {
    SMART_PROCESS_ID,
    POLYGON_TYPE_ID,
    POINT_TYPE_ID,
    getGeoObjects,
    getStages,
    getPolygons,
    getPoints,
    createGeoObject,
    updateGeoObject,
    deleteGeoObject,
    openEntityCard,
    getAuthData
  }
}
