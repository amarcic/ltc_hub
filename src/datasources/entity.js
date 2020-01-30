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

    async getEntityById({ eId }) {
        // something goes wrong when destructuring the parameter object...
        const response = await this.get(`entity/${eId}` , {live: false} );
        return this.entityReducer(response[0])
    }
}

module.exports = EntityAPI;