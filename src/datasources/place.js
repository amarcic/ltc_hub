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
            name: place.prefName&&place.prefName.title ? place.prefName.title : "no name found",
            parentId: place.parent && place.parent.slice(35),
            ancestorIds: place.ancestors && place.ancestors.map( ancestor => ancestor.slice(35)),
            coordinates: place.prefLocation && place.prefLocation.coordinates
                ? place.prefLocation.coordinates.join(", ")
                : "0, 0"
        }
    }

    async getPlaceById({ placeId }) {
        if (!placeId) return;
        const response = await this.get(`doc/${ placeId }.json` ).catch((err) => { return {gazId: placeId, prefName: {title: "super secret hideout"}} });
        return this.placeReducer(response);
    }

    getPlacesByIds({ placeIds }) {
        if (!placeIds) return;
        return Promise.all(
            placeIds.map( placeId => this.getPlaceById({ placeId }) )
        );
    }

    getPlacesByIdAndType({ placeInfo, relationTypes }) {
        if (!placeInfo) return;
        if (relationTypes) {
            const filteredPlaces = placeInfo.filter( infoObj => relationTypes.indexOf(infoObj.locationType)>-1 )
            return Promise.all(
                filteredPlaces.map( infoObj => this.getPlaceById({ placeId: infoObj.placeId}))
            );
        } else {
        return Promise.all(
            placeInfo.map( infoObj => this.getPlaceById({ placeId: infoObj.placeId}))
        );
        }
    }

    async fetchChildren({ parentPlaceId}) {
        if (!parentPlaceId) return;
        const response = await this.get( 'search.json', {q: `parent:${parentPlaceId}`});
        return response.result.map( place => this.placeReducer(place));
    }
}

module.exports = PlaceAPI;