module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id })
    },
    Entity: {
        spatial: ( entity, _, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: entity.places })
    }
}