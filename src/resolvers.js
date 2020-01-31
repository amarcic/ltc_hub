module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id })
    }
}