const { RESTDataSource } = require('apollo-datasource-rest');

class PeriodAPI extends RESTDataSource {
    constructor() {
        super();
        //production server
        this.baseURL = 'http://chronontology.dainst.org/data/';
        //dev server for SPP2143 data
        //this.baseURL = 'https://chronontology-test.dainst.org/data/';
    }

    periodReducer( period, { language } ) {
        //if(!period||!period.resource) return;
        return {
            identifier: period.resource.id,
            //later map the whole array not just the first element
            title: period.resource.names[language] ? period.resource.names[language][0] : Object.values(period.resource.names)[0][0],
            begin: period.resource.hasTimespan
                    && period.resource.hasTimespan[0].begin
                ? period.resource.hasTimespan[0].begin.at || period.resource.hasTimespan[0].begin.notBefore
                : "",
            end: period.resource.hasTimespan
                    && period.resource.hasTimespan[0].end
                    //&& period.resource.hasTimespan[0].end.at
                ? period.resource.hasTimespan[0].end.at || period.resource.hasTimespan[0].end.notAfter
                : "",
            datingText: period.resource.hasTimespan
                            && period.resource.hasTimespan[0]
                ? period.resource.hasTimespan[0].timeOriginal
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
            periodIds.flat().map( periodId => this.getPeriodById({ periodId, language, type }))
        );
    }

    getNestedPeriodsByIds({ periodIds, language, type }) {
        if(!periodIds) return;
        const promisedPeriods = periodIds.map( ids =>
            ids.map( periodId =>
                this.getPeriodById({ periodId, language, type })
        ) )
        return Promise.all(
            promisedPeriods
        );
    }

    async getPeriodByNameAndProvenance({ periodName, provenance }) {
        const response = await this.get(`period/`, { q: periodName, fq: `resource.provenance:${ provenance }`});
        //results[0] only since it should be the first result when looking for relations between Arachne and ChronOntology
        const chronOntologyId = response.results[0].resource.id;
        const reresponse = await this.getPeriodById({periodId: chronOntologyId, language: "de"});
        return reresponse;
    }

    //testing limitation: only tested with single parent; language hardwired to german
    async getPeriodContext({ parentPeriodId, resultArray, openBranches }) {
        const result = await this.getPeriodById({periodId: parentPeriodId, language: "de"});
        const currentResultList = [result, ...resultArray];

        let branches = result.isPartOfIds
            ? [...result.isPartOfIds, ...openBranches]
            : openBranches;

        if (/*result.isPartOfIds||*/branches.length>0) {
            return this.getPeriodContext({ parentPeriodId: branches.shift(), resultArray: currentResultList, openBranches: branches })
        } else {
            return currentResultList;
        }
    }
}

module.exports = PeriodAPI;