const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        name: String
        description: String
        isA: Subject
        isPartOf: Entity
        spacial: Place
        temporal: Period
    }
    type Subject {
        URID: ID!
        title: String
    }
    type Place {
        identifier: ID!
        name: String
        coordinates: String

    }
    type Title{
        language: Languages
        label: String 
    }
    type Period {
        URID: ID!
        title(language: Languages): String
        begin: String
        end: String
    }
    enum Languages {
        de
        en
        it
        fr
        ar
    }
    type Query {
        entity(id: ID!): Entity 
        place(id: ID!): Place
    }
`;

module.exports = typeDefs;