module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        entities: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: ids }),
        locatedEntities: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationId({ locationId: id }),
        EntitiesByLocations: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationIds({ locationIds: ids }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id })
    },
    Entity: {
        spatial: ( entity, _, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: entity.places }),
        isA: ( entity, _, {dataSources}) =>
            //ids of subjects/thesaurus concepts are not found in iDAI.objects data sets, so they cannot be passed to the subject API
            // replace the hardcoded ID below later
            dataSources.subjectAPI.getSubjectById({ subjectId: "_8bca4bf1"}),
        temporal: ( entity, { language }, {dataSources}) =>
            //chronontology ID is fixed for now since iDAI.objects has no IDs, just period names
            dataSources.periodAPI.getPeriodById({ periodId: "pWTRfQzFdKi9", language: language? language : "de" }),
        related: ( entity, _, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: entity.relatedEntities })
    }
}