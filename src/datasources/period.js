const { RESTDataSource } = require('apollo-datasource-rest');

class PeriodAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'http://chronontology.dainst.org/data/';
    }

    periodReducer( period, { language } ) {
        //if(!period||!period.resource) return;
        return {
            identifier: period.resource.id,
            //later map the whole array not just the first element
            title: period.resource.names[language] ? period.resource.names[language][0] : "no name in this language found",
            begin: period.resource.hasTimespan
                    && period.resource.hasTimespan[0].begin
                ? period.resource.hasTimespan[0].begin.at
                : "*",
            end: period.resource.hasTimespan
                    && period.resource.hasTimespan[0].end
                    && period.resource.hasTimespan[0].end.at
                ? period.resource.hasTimespan[0].end.at
                : "",
            coreAreaIds: period.resource.hasCoreArea && period.resource.hasCoreArea.map( gazetteerURI => gazetteerURI.substr(-7) ),
            types: period.resource.types && period.resource.types,
            hasMeanings: period.resource.relations && period.resource.relations.hasSense,
            followsIds: period.resource.relations && period.resource.relations.follows && period.resource.relations.follows,
            isFollowedByIds: period.resource.relations && period.resource.relations.isFollowedBy,
            isPartOfIds: period.resource.relations && period.resource.relations.isPartOf,
            hasPartIds: period.resource.relations && period.resource.relations.hasPart
        }
    }

    async getPeriodById({ periodId, language, type }) {
        if (!periodId) return;
        const response = await this.get(`period/${ periodId }` );
        if (type&&response.resource.types.indexOf(type)===-1) return;
        return this.periodReducer(response, { language });
    }

    getPeriodsByIds({ periodIds, language, type }) {
        if(!periodIds) return;
        return Promise.all(
            periodIds.map( periodId => this.getPeriodById({ periodId, language, type }))
        );
    }

    async getPeriodByNameAndProvenance({ periodName, provenance }) {
        const response = await this.get(`period/`, { q: periodName, fq: `resource.provenance:${ provenance }`});
        //results[0] only since it should be the first result when looking for relations between Arachne and ChronOntology
        const chronOntologyId = response.results[0].resource.id;
        const reresponse = await this.getPeriodById({periodId: chronOntologyId, language: "de"});
        return reresponse;
    }
}

module.exports = PeriodAPI;