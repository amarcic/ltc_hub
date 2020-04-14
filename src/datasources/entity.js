const { RESTDataSource } = require('apollo-datasource-rest');

class EntityAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://arachne.dainst.org/data/';
    }

    entityReducer(entity) {
        return{
            identifier: entity.entityId,
            name: entity.title,
            places: entity.places ? entity.places[0].gazetteerId : "",
            relatedEntities: entity.connectedEntities,
            type: entity.type,
            periodName: entity.facet_datierungepoche ? entity.facet_datierungepoche[0] : ""
        };
    }

    async getEntityById({ entityId }) {
        const response = await this.get(`entity/${entityId}`, {live: true} );
        return this.entityReducer(response);
    }

    getEntitiesById({ entityIds }) {
        return Promise.all(
            entityIds.map( entityId => this.getEntityById({ entityId }) )
        );
    }

    async getEntitiesByString({ searchString, filters }) {
        const filtersConcat = filters && filters.map( filter => `facet_bestandsname:"${filter}"` ).join(' OR ');
        /*filters
                            ? filters.map( filter => `facet_bestandsname:"${filter}"` ).join(' OR ')
                            : "";*/
        const params = filters
                        ? {q: `${searchString} AND (${filtersConcat})` }
                        : {q: searchString};
        const response = await this.get( 'search', params);
        const entityIds = response.size > 0
                            ? response.entities.map( entity => entity.entityId)
                            : [];
        return this.getEntitiesById( {entityIds} );
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
}

module.exports = EntityAPI;