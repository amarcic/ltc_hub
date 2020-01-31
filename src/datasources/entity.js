const { RESTDataSource } = require('apollo-datasource-rest');

class EntityAPI extends RESTDataSource {
    constructor() {
        super();
    this.baseURL = 'https://arachne.dainst.org/data/';
    }

    entityReducer(entity) {
        return{
            identifier: entity.entityId,
            name: entity.title

        };
    }

    async getEntityById({ entityId }) {
        const response = await this.get(`entity/${entityId}` , {live: false} );
        return this.entityReducer(response)
    }
}

module.exports = EntityAPI;