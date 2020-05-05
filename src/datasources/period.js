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
            title: period.resource.names[language][0],
            begin: period.resource.hasTimespan ? period.resource.hasTimespan[0].begin.at : "",
            end: period.resource.hasTimespan ? period.resource.hasTimespan[0].end.at : ""
        }
    }

    async getPeriodById({ periodId, language }) {
        const response = await this.get(`period/${ periodId }` );
        return this.periodReducer(response, { language });
    }

    async getPeriodByNameAndProvenance({ periodName, provenance }) {
        const response = await this.get(`period/`, { q: periodName, fq: `resource.provenance:${ provenance }`});
        //results[0] only since it should be the first result when looking for relations between Arachne and ChronOntology
        const chronOntologyId = response.results[0]//&&response.results[0].resource
                                    ? response.results[0].resource.id
                                    : "";
        const reresponse = await this.getPeriodById({periodId: chronOntologyId, language: "de"});
        return reresponse;
    }
}

module.exports = PeriodAPI;