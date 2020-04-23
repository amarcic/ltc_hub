module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        entities: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: ids }),
        entitiesByString: (_, { searchString, filters }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByString({ searchString: searchString, filters: filters }),
        locatedEntities: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationId({ locationId: id }),
        entitiesByLocations: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationIds({ locationIds: ids }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id })
    },
    Entity: {
        spatial: ( entity, _, {dataSources}) =>
            dataSources.placeAPI.getPlacesByIds({ placeIds: entity.places }),
        isA: ( entity, _, {dataSources}) =>
            //ids of subjects/thesaurus concepts are not found in iDAI.objects data sets, so they cannot be passed to the subject API
            // replace the hardcoded ID below later
            dataSources.subjectAPI.getSubjectById({ subjectId: "_8bca4bf1"}),
        temporal: ( entity, { language }, {dataSources}) =>
            //chronontology ID is fixed for now since iDAI.objects has no IDs, just period names
            dataSources.periodAPI.getPeriodById({ periodId: "pWTRfQzFdKi9", language: language? language : "de" }),
        temporalArachne: ( entity, _, {dataSources}) =>
            //limiting provenance to "Arachne" in most cases identifies the iDAI.chronontology periods associated with datings in iDAI.arachne
            dataSources.periodAPI.getPeriodByNameAndProvenance({ periodName: entity.periodName, provenance: "Arachne" }),
        related: ( entity, { types }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: entity.relatedEntities, types: types })
    }
}