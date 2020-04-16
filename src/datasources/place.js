const { RESTDataSource } = require('apollo-datasource-rest');

class PlaceAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'http://gazetteer.dainst.org/';
    }

    placeReducer( place ) {
        if(!place) return;
        return {
            identifier: place.gazId,
            name: place.prefName.title,
            coordinates: place.prefLocation && place.prefLocation.coordinates
                ? place.prefLocation.coordinates.join(", ")
                : "0, 0"
        }
    }

    async getPlaceById({ placeId }) {
        //quick fix; implement solid catching; maybe handle by entity type
        if (!placeId) return;
        //should resolver be changed to connect to actual database and not elasticsearch index?
        const response = await this.get(`doc/${ placeId }.json` ).catch((err) => { console.log(err); });
        return this.placeReducer(response);
    }

    getPlacesByIds({ placeIds }) {
        if (!placeIds) return;
        return Promise.all(
            placeIds.map( placeId => this.getPlaceById({ placeId }) )
        );
    }
}

module.exports = PlaceAPI;