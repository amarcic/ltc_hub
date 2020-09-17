module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id }),
        entities: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: ids }),
        entitiesByString: (_, { searchString, filters }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByString({ searchString: searchString, filters: filters }),
        entitiesMultiFilter: (_, { searchString, period, coordinates, projects, entityTypes }, {dataSources}) =>
            dataSources.entityAPI.getFilteredEntities({ searchString: searchString, period: period, coordinates: coordinates, projects: projects, entityTypes: entityTypes }),
        locatedEntities: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationId({ locationId: id }),
        entitiesByLocations: (_, { ids }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationIds({ locationIds: ids }),
        entitiesByPeriod: (_, { periodString }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByPeriod({ periodTerm: periodString }),
        entitiesByCoordinates: (_, { coordinates }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByCoordinates({ coordinates: coordinates }),
        place: (_, { id }, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({ placeId: id }),
        places: (_, {ids}, {dataSources}) =>
            dataSources.placeAPI.getPlacesByIds({placeIds: ids}),
        archaeologicalSites: (_, { searchString, coordinates }, {dataSources}) =>
            dataSources.placeAPI.getArchaeologicalSites({ searchString: searchString, coordinates: coordinates }),
        sitesByRegion: (_, {id, searchString }, {dataSources}) =>
            dataSources.placeAPI.getArchaeologicalSitesByRegion({ searchString: searchString, regionId: id }),
        periodById: (_, {id}, {dataSources}) =>
            dataSources.periodAPI.getPeriodById({periodId: id, language: "de"})
    },
    Entity: {
        spatial: ( entity, { relations }, {dataSources}) =>
            dataSources.placeAPI.getPlacesByIdAndType({ placeInfo: entity.places, relationTypes: relations }),
        isA: ( entity, _, {dataSources}) =>
            //ids of subjects/thesaurus concepts are not found in iDAI.objects data sets, so they cannot be passed to the subject API
            // replace the hardcoded ID below later
            dataSources.subjectAPI.getSubjectById({ subjectId: "_8bca4bf1"}),
        temporal: ( entity, { meanings, language }, {dataSources}) =>
            //chronontology ID is fixed for now since iDAI.objects has no IDs, just period names
            dataSources.periodAPI.getPeriodsByIds({ periodIds: entity.periodIds, meanings: meanings || "all", language: language? language : "de" }),
        temporalArachne: ( entity, _, {dataSources}) =>
            //limiting provenance to "Arachne" in most cases identifies the iDAI.chronontology periods associated with datings in iDAI.arachne
            dataSources.periodAPI.getPeriodByNameAndProvenance({ periodName: entity.periodName, provenance: "Arachne" }),
        related: ( entity, { types }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesById({ entityIds: entity.relatedEntities, types: types })
    },
    Place: {
        temporal:  /*async*/ ( place, { language }, {dataSources}) => {
            //"Topographien" is probably just a fill in for testing the code
            return dataSources.entityAPI.getEntitiesByLocationId({ locationId: place.identifier, types: ["Topographien"]})
                .then( arrayOfPromisedEntities =>
                        Promise.all(arrayOfPromisedEntities).then( resolvedEntites =>
                            //get ids of periods from fetched entities
                            resolvedEntites.map( entity => entity.periodIds )
                                .flat()
                                //filter duplicate period ids: 1.sort 2.filter repeated
                                .sort()
                                .filter( (item, position, array ) =>
                                    !position || item != array[position-1] )
                                //fetch period data for each id
                                .map( periodId =>
                                    dataSources.periodAPI.getPeriodById({ periodId: periodId, language: language? language : "de"})
                            )
                        )
                    );
            /*const linkedEntities = await dataSources.entityAPI.getEntitiesByLocationId({ locationId: place.identifier, types: ["Topographien"]});
            const entityPromiseArray = linkedEntities || [];
            const resolvedEntities = await Promise.all(entityPromiseArray);
            const periodIds = resolvedEntities
                                .map( m => m && m.periodIds )
                                .filter( a => Array.isArray(a) && a.length>0)
            const flatPeriodIds = periodIds.length > 0 ? periodIds.reduce( (acc, arr) => [ ...acc, ...arr] ) : periodIds;
            const uniquePeriodIds = [...new Set(flatPeriodIds)];
            const fetchedPeriods = dataSources.periodAPI.getPeriodsByIds({ periodIds: uniquePeriodIds, language: language? language : "de"})
            return fetchedPeriods;*/
        },
        locatedIn: ( place, _, {dataSources}) =>
            dataSources.placeAPI.getPlaceById({placeId: place.parentId}),
        locatedInPlaces: ( place, _, {dataSources}) =>
            dataSources.placeAPI.getPlacesByIds({ placeIds: place.ancestorIds }),
        containedSites: ( place, _, {dataSources}) =>
            dataSources.placeAPI.getArchaeologicalSitesByRegion({ regionId: place.identifier}),
        discoveryContext: ( place, _, {dataSources}) =>
            dataSources.placeAPI.getSiblings({siteId: place.parentId, placeTypes:place.types, siblingType:'archaeological-site'}),
        linkedObjects: ( place, { types }, {dataSources}) =>
            dataSources.entityAPI.getEntitiesByLocationId({locationId: place.identifier, types: types})
    },
    Period: {
        coreArea: ( period, _, {dataSources}) =>
            dataSources.placeAPI.getPlacesByIds({ placeIds: period.coreAreaIds }),
        senses: (period, {typeOfSense, language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodsByIds({ periodIds: period.hasMeanings, language: language||"de", type: typeOfSense||undefined }),
        follows: ( period, {language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodsByIds({ periodIds: period.followsIds, language: language||"de" }),
        followedBy: ( period, {language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodsByIds({ periodIds: period.isFollowedByIds, language: language||"de" }),
        partOf: ( period, {language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodsByIds({ periodIds: period.isPartOfIds, language: language||"de" }),
        parts: ( period, {language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodsByIds({ periodIds: period.hasPartIds, language: language|| "de" }),
        periodContext: ( period, {language}, {dataSources}) =>
            dataSources.periodAPI.getPeriodContext({parentPeriodId: period.isPartOfIds[0], resultArray: [], openBranches: period.isPartOfIds.length>1 ? period.isPartOfIds.slice(1) : []})
    }
}