const { RESTDataSource } = require('apollo-datasource-rest');

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
        //the folling section is just for preparing the ChronOntology Id from iDAI.objects data sets
        const datingObjects = entity.sections && entity.sections[0].content.find( object => object.label==="Datierung");
        const datingStrings = datingObjects
                                && datingObjects.content
                                && datingObjects.content.map( dating => dating.value && dating.value.match(/\/period\/(\w+)/));
        const periodIdentifier = datingStrings && datingStrings.map( stringArray => stringArray && stringArray.length>0 && stringArray[1])
        //actual reducer
        return{
            identifier: entity.entityId,
            name: entity.title,
            places: entity.places
                ? entity.places.map( place => {
                    return{
                        placeId: place.gazetteerId,
                        locationType: place.relation ? place.relation : "unspecified"
                    }
                } )
                : "",
            relatedEntities: entity.connectedEntities ? entity.connectedEntities : "",
            type: entity.type,
            periodIds: periodIdentifier,
                //datings && datings.content && datings.content.map( dating => dating.value && dating.value.match(/\/period\/(\w+)/)[1]),
            periodName: entity.facet_datierungepoche ? entity.facet_datierungepoche[0] : ""
        };
    }

    async getEntityById({ entityId }) {
        const response = await this.get(`entity/${entityId}`, {live: true} ).catch(() => {});
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

    async getFilteredEntities({ searchString, coordinates, period, projects, entityTypes }) {
        const searchStr = searchString&&searchString!=="" ? searchString: '*';
        const projectsConcat = projects && projects.length>0
                                ? ` AND ` + projects.map( project => `facet_bestandsname:${project}` ).join(' OR ')
                                : "";
        const coordniatesConcat = coordinates && `bbox:${coordinates.join(',')}`;
        let params = {
            q: `${searchStr} ${projectsConcat}`
        }
        if(coordinates&&coordinates.length===4) params['bbox']= coordinates;
        if(period&&period!=="") params['fq']= `facet_datierungepoche:${period}`;
        const response = await this.get( 'search', params);
        const entityIds = response.size > 0
            ? response.entities.map( entity => entity.entityId)
            : [];
        return this.getEntitiesById( {entityIds, types: entityTypes} );
    }

    async getEntitiesByLocationId({ locationId }) {
        const response = await this.get(`search`, {q: `places.gazetteerId:${locationId}` });
        //the following uncanny code works because when destructuring the entity passed to getEntityById
        //there actually is a key "entityId" on the passed object
        //return response.entities.map( entity => this.getEntityById( entity ) )
        //corrected code below: now only the value of entityId is passed to getEntityById
        return response.entities.map( entity => this.getEntityById({ entityId: entity.entityId }) );
    }

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