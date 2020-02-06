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
            places: entity.places[0].gazetteerId

        };
    }

    /*
    async getAllEntities() {
        const response = await this.get( "", {q: "*"});
    }

     */

    async getEntityById({ entityId }) {
        const response = await this.get(`entity/${entityId}` , {live: false} );
        return this.entityReducer(response);
    }

    getEntitiesById({ entityIds }) {
        return Promise.all(
            entityIds.map( entityId => this.getEntityById({ entityId }))
        );
    }
    /* cannot access index to look up entities by iDAI.gazetteer ids
    getEntitiesByLocationId({ locationId }) {

    }*/
}

module.exports = EntityAPI;