const { RESTDataSource } = require('apollo-datasource-rest');
const { extractDatingSections, extractChronOntologyIds, matchSectionSelection } = require('../datingExtraction');

const valueMapRelatedObjects = {
    Einzelobjekte: 'Einzelobjekte',
    MehrteiligeDenkmaeler: 'Mehrteilige Denkmäler',
    Bauwerke: 'Bauwerke',
    Bauwerksteile: 'Bauwerksteile',
    Bilder: 'Bilder',
    Buecher: 'Bücher',
    Buchseiten: 'Buchseiten',
    Einzelmotive: 'Einzelmotive',
    Gruppierungen: 'Gruppierungen',
    Inschriften: 'Inschriften',
    Literatur: 'Literatur',
    Orte: 'Orte',
    Reproduktionen: 'Reproduktionen',
    Personen: 'Personen',
    Rezeptionen: 'Rezeptionen',
    Sammlungen: 'Sammlungen',
    Szenen: 'Szenen',
    Topographien: 'Topographien',
    Typen: 'Typen',
    dreiDModelle: '3D-Modelle'
}

class EntityAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://arachne.dainst.org/data/';
    }

    entityReducer(entity) {
        if(!entity) return;
        const datingStringArray = extractDatingSections(entity.sections, matchSectionSelection);

        //actual reducer
        return{
            identifier: entity.entityId,
            name: entity.title,
            places: entity.places
                ? entity.places.map( place => {
                    return{
                        placeId: place.gazetteerId,
                        locationType: place.relation || "unspecified"
                    }
                } )
                : "",
            relatedEntities: entity.connectedEntities || "",
            type: entity.type,
            periodIds: extractChronOntologyIds(datingStringArray),
            periodNames: entity.facet_datierungepoche || [],
            onDating: datingStringArray,
            catalogPaths: entity.catalogPaths

            //dating: getDatingHumReadable(datingArray),
            //datingSpan: getDatingSpan(datingArray)
        };
    }

    async getEntityById({ entityId, types }) {
        const response = await this.get(`entity/${entityId}`, {live: true} ).catch(() => {});
        if (types&&types.indexOf(response.type)===-1) return;
        return this.entityReducer(response);
    }

    getEntitiesById({ entityIds, types }) {
        if(!entityIds) return;
        //I don't like this if-else structure; can we simplify it? maybe by giving a default filter that is only replaced by types
        if (types) {
            const arachneTypes = types.map( type => valueMapRelatedObjects[type]);
            return Promise.all(
            //for all values in entityIds the corresponding entity is fetched
                entityIds.map( entityId => this.getEntityById({ entityId }) )
            //the mapped array of entities is filtered by the values given in types
            ).then( values => values.filter( entity => entity&&arachneTypes.indexOf(entity.type)>-1));
        } else {
            return Promise.all(
                entityIds.map( entityId => this.getEntityById({ entityId }) )
            );
        }
    }

    //this getter uses the iDAI.objects catalog API
    //catalog entries are fetched recursively and ids for Arachne entities collected
    //data is available as soon as a catalog is created in Arachne
    async getEntitiesFromCatalogRecursively({catalogId, catalogEntryId}) {

        //catalog Id is only considered when no entry Id is given, since entry Id is more specific
        const catalogPath = catalogEntryId
            ? `entry/${catalogEntryId}`
            : catalogId;

        let entityIds = [];
        let childrenIds = [];

        const catalogEntry = await this.get(`catalog/${catalogPath}`);
        //const catalogEntry = await this.get(`catalog/entry/${catalogEntryId}`);

        if(!catalogEntry) return;

        catalogEntry.arachneEntityId
            && entityIds.push(catalogEntry.arachneEntityId);

        if (catalogEntry.totalChildren>0) {
            catalogEntry.children.forEach( child => {
                child.arachneEntityId && child.totalChildren===0
                    && entityIds.push(child.arachneEntityId);
                child.totalChildren>0
                    && childrenIds.push(child.id)
            } );
        }

        //catalog Id is only considered when no entry Id is given, since entry Id is more specific
        if(catalogId
            &&!catalogEntryId
            &&catalogEntry.root
            &&catalogEntry.root.totalChildren>0) {
                catalogEntry.root.children.forEach( child => {
                    child.arachneEntityId && child.totalChildren===0
                    && entityIds.push(child.arachneEntityId);
                    child.totalChildren>0
                    && childrenIds.push(child.id)
                } );
        }
        const nestedEntities = await Promise.all( childrenIds.map( childId => this.getEntitiesFromCatalogRecursively({catalogEntryId: childId}) ) );
        return [...entityIds, ...nestedEntities].flat();
    }

    async getEntitiesByCatalogEntryId({ catalogId, catalogEntryId }) {

        const entityIds = await this.getEntitiesFromCatalogRecursively({catalogId: catalogId, catalogEntryId: catalogEntryId});

        if (entityIds.length>0)
            return this.getEntitiesById({entityIds: entityIds});
    }

    /* now included in getEntitiesFromCatalog
    async getEntitiesByCatalogId({ catalogId }) {
        const response = await this.get('search', {q: 'catalogIds:' + catalogId});
        const entityIds = response.size > 0
                            ? response.entities.map( entity => entity.entityId)
                            : [];
        return this.getEntitiesById( {entityIds} );
    }*/

    async getEntitiesFromCatalog({ catalogId, entryId }) {
        const queryParameter = catalogId&&entryId
                                ? {q: `catalogPaths:${catalogId} AND ${entryId}` }
                                : {q: `catalogIds:${catalogId}`}
        const response = await this.get('search', queryParameter);

        const entityIds = response.size > 0
            ? response.entities.map( entity => entity.entityId)
            : [];
        return this.getEntitiesById( {entityIds} );
    }

    async getEntitiesByString({ searchString, filters }) {
        const filtersConcat = filters && filters.map( filter => `facet_bestandsname:${filter}` ).join(' OR ');
        const params = filters && filters.length > 0
                        ? {q: `${searchString} AND (${filtersConcat})`, limit: 200/*, fq: "facet_ortsangabe:Fundort"*/ }
                        : {q: searchString, limit: 200/*, fq: "facet_ortsangabe:Fundort"*/};
        const response = await this.get( 'search', params );
        const entityIds = response.size > 0
                            ? response.entities.map( entity => entity.entityId)
                            : [];
        return this.getEntitiesById( {entityIds} );
    }

    async getFilteredEntities({ searchString, coordinates, period, projects, catalogIds, entityTypes }) {
        const searchStr = searchString&&searchString!=="" ? searchString : '*';
        const typesFilter = entityTypes && entityTypes.length>0
                            ? " AND facet_kategorie:(" + entityTypes.map( type => `"${type}"`).join(" OR ") + ")"
                            : "";
        const projectsConcat = projects && projects.length>0
                                ? ` AND ` + projects.map( project => `facet_bestandsname:${project}` ).join(' OR ')
                                : "";
        const catalog = catalogIds && catalogIds.length>0
                        ? ` AND ${catalogIds.map( catalogId => 'catalogIds:'+catalogId).join(' OR ')}`
                        : "";
        //problem with ambiguous ids when using "catalogPaths":
        //const catalog = catalogId ? ` AND catalogPaths:${catalogId}` : "";
        //const coordniatesConcat = coordinates && `bbox:${coordinates.join(',')}`;
        let params = {
            q: `${searchStr} ${catalog} ${projectsConcat} ${typesFilter}`
        }
        if(coordinates&&coordinates.length===4) params['bbox']= coordinates;
        if(period&&period!=="") params['fq']= `facet_datierungepoche:${period}`;
        const response = await this.get( 'search', params);
        const entityIds = response.size > 0
            ? response.entities.map( entity => entity.entityId)
            : [];
        return this.getEntitiesById( {entityIds} );
    }

    async getEntitiesByLocationId({ locationId, types }) {
        const typesFilter = types
                                ? types.map( type => `fq=facet_kategorie:"${type}"`).join("&")
                                : "";
        const locationSearch = `q=places.gazetteerId:${locationId}`;
        const response = await this.get(`search?${typesFilter}&${locationSearch}`);
        //const response = await this.get(`search`, {q: `places.gazetteerId:${locationId}` });
        if (response.entities) {
            return response.entities.map( entity => this.getEntityById({ entityId: entity.entityId }) );
        }
    }

    //not working correctly; not needed right now
    /*
    async getEntitiesPeriodIdsByLocationId({ locationId, types }) {
        const typesFilter = types
            ? types.map( type => `fq=facet_kategorie:"${type}"`).join("&")
            : "";
        const locationSearch = `q=places.gazetteerId:${locationId}`;
        const response = await this.get(`search?${typesFilter}&${locationSearch}`);
        const relatedEntities = await response.entities.map( entity => this.getEntityById({ entityId: entity.entityId }));
        //const resolvedEntities = await Promise.all(relatedEntities);
        const periodIds = await relatedEntities
                                    .map( entity => entity.periodIds )
                                    .filter( a => Array.isArray(a) && a.length>0);
        const flatPeriodIds = periodIds.length > 0 ? periodIds.reduce( (acc, arr) => [ ...acc, ...arr] ) : periodIds;
        const uniquePeriodIds = [...new Set(flatPeriodIds)];
        return uniquePeriodIds;
        //if (response.entities) {
        //    return response.entities.map( entity => this.getEntityById({ entityId: entity.entityId, types: types })
        //        .then( entity => entity && entity.periodIds)
        //        .then( arrayOfPeriodIdsArrays =>
        //            arrayOfPeriodIdsArrays && arrayOfPeriodIdsArrays.reduce( (accumulator, array ) => [ ...accumulator, ...array ] ))
        //    );
        ///
    }
    */

    // for some gazetteer Ids: when accessing the spatial property of the entities an error occurs
    getEntitiesByLocationIds({ locationIds }) {
        return Promise.all(
            locationIds.map( locationId => this.getEntitiesByLocationId({ locationId }) )
        )
    }

    async getEntitiesByCoordinates({ coordinates }) {
        const response = await this.get(`search`, {q:'*', bbox: coordinates.join(', ')});
        return response.entities.map( entity => this.getEntityById({ entityId: entity.entityId }) );
    }

    async getEntitiesByPeriod({ periodTerm }) {
        const response = await this.get( `search`, {q:'*', fq: `facet_datierungepoche:${periodTerm}`});
        if(response.entities===undefined) return;
        return response.entities.map( entity => this.getEntityById({ entityId: entity.entityId }) );
    }
}

module.exports = EntityAPI;