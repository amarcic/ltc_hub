const { RESTDataSource } = require('apollo-datasource-rest');

class PlaceAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'http://gazetteer.dainst.org/';
    }

    placeReducer( place ) {
        return {
            identifier: place.gazId,
            name: place.prefName.title,
            coordinates: place.prefLocation.coordinates.join(", ")
        }
    }

    async getPlaceById({ placeId }) {
        //should resolver be changed to connect to actual database and not elasticsearch index?
        const response = await this.get(`doc/${ placeId }.json` );
        return this.placeReducer(response);
    }
}

module.exports = PlaceAPI;