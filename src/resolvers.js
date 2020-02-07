module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        entities: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: ids }),
        locatedEntities: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationId({ locationId: id }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id })
    },
    Entity: {
        spatial: ( entity, _, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: entity.places })
    }
}