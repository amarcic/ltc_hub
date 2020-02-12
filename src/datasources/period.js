const { RESTDataSource } = require('apollo-datasource-rest');

class PeriodAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'http://chronontology.dainst.org/data/';
    }

    periodReducer( period ) {
        return {
            identifier: period.resource.id,
            //later map the whole array not just the first element
            title: period.resource.names.de[0],
            begin: period.resource.hasTimespan[0].begin.at,
            end: period.resource.hasTimespan[0].end.at
        }
    }

    async getPeriodId({ periodId }) {
        const response = await this.get(`period/${ periodId }` );
        return this.periodReducer(response);
    }
}

module.exports = PeriodAPI;