const { RESTDataSource } = require('apollo-datasource-rest');

class SubjectAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'http://thesauri.dainst.org/de/';
    }

    subjectReducer( subject ) {
        return {
            identifier: subject.origin,
            //later map the whole array not just the first element
            title: subject.labels[0].value
        }
    }

    async getSubjectById({ subjectId }) {
        const response = await this.get(`concepts/${ subjectId }.json` );
        return this.subjectReducer(response);
    }
}

module.exports = SubjectAPI;