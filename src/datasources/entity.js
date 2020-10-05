const { RESTDataSource } = require('apollo-datasource-rest');
const { dateParserArachne } = require('../serviceFunctions');

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

    //this function collects linked ChronOntology Ids from dating objects in sections in arachne response json
    temporalFromArachneSections(sectionsArray) {
        /*
        const regexOld =
            /(\w+: )?(([1-4]+\. Viertel|[1-2]\. Hälfte|Mitte|Ende\/spätes|Spätes|Anfang\/frühes|Ende|[1-3]\. Drittel)( |, | des )?)?([0-9]\. (Jahrzehnt|Jzehnt), )?(um [0-9-]+ [nv]?\. Chr|([0-9]\.?(-| - ))?[0-9\.]+ (Jh\.|Jhs\.|Jahrhundert|Jt\.) [vn]?\. Chr)( \((um|nach|vor|gegen|ca.) [0-9-]+( v\. Chr)?\))?/g;
        */
        const regexNew =
            /(?<about>\w+(?: \(\w+\))?: )?(?:(?<fractionCentMilDigit>\d\. )?(?<fraction>Viertel|Drittel|Hälfte|Mitte|Ende\/spätes|Anfang\/frühes|Ende|Anfang|Jzehnt|Jahrzehnt)?, )?(?<yearCentMilDigit>(?:\d+\.? ?- ?)?(?:\d+\.?))(?<centuryMillenium> Jh\.?| Jhs\.?| Jahrhundert| Jt\.?)? (?<bcAd>[vn]\. Chr\.?)(?: \((?<detailMod>ca\.? |um |nach |vor | gegen |~)?(?<detailDigit>\d+)\))?/g;
        const datingStrings = [];
        let wholeString = "";
        let dateArray = [];
        sectionsArray && sectionsArray.forEach( section => section.content.forEach( object => {
            if(object.label==="Datierung") {
                wholeString = object.content[0].value.toString();
                let capture = wholeString.match(/\/period\/(\w+)/g);
                let captureDate = wholeString
                                    .match(regexNew);
                if (Array.isArray(captureDate))
                    dateArray = captureDate;
                //dateArray = Array.isArray(captureDate)? captureDate : [];
                if (Array.isArray(capture))
                    datingStrings.push(...capture);
            }
            }
        ) );
        const uniqueDatingStrings = [...new Set(datingStrings)];
        const ChronOntologyIds = uniqueDatingStrings && uniqueDatingStrings.map( string => string.slice(8) );
        return { ids: ChronOntologyIds, text: wholeString, date: dateArray};
    }

    entityReducer(entity) {
        if(!entity) return;
        //actual reducer
        const datingObj = this.temporalFromArachneSections(entity.sections);
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
            periodIds: this.temporalFromArachneSections(entity.sections).ids,
            periodName: entity.facet_datierungepoche || [],
            onDating: datingObj.text,
            dating:datingObj.date,
            datingSpan: dateParserArachne(datingObj.date)
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
        const searchStr = searchString&&searchString!=="" ? searchString : '*';
        const typesFilter = entityTypes && entityTypes.length>0
            ? " AND facet_kategorie:(" + entityTypes.map( type => `"${type}"`).join(" OR ") + ")"
            : "";
        const projectsConcat = projects && projects.length>0
                                ? ` AND ` + projects.map( project => `facet_bestandsname:${project}` ).join(' OR ')
                                : "";
        //const coordniatesConcat = coordinates && `bbox:${coordinates.join(',')}`;
        let params = {
            q: `${searchStr} ${projectsConcat} ${typesFilter}`
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