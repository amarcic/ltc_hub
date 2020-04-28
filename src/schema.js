const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        name: String
        description: String
        """
        isA field is currently using the same hard coded id for all queries
        """
        isA: Subject
        isPartOf: Entity
        related(types: [RelatedType]): [Entity]
        spatial(relation: [SpatialRelations]): [Place]
        temporal(language: Languages): Period
        """
        retrieve period data for Arachne objects from ChronOntology when no ID is given in the data set
        """
        temporalArachne: Period
        periodName: String
        type: String
    }
    type Subject {
        identifier: ID!
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
        identifier: ID!
        title: String
        begin: String
        end: String
    }
    enum SpatialRelations {
        fundort
    }
    enum RelatedType {
        Einzelobjekte
        Literatur
        Orte
        Sammlungen
        Inschriften
        """
        the value MehrteiligeDenkmaeler cannot work, since it does not correspond to the value in Arachne; pls decouple
        """
        MehrteiligeDenkmaeler
        Bilder
        Buchseiten
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
        entities(ids: [ID]!): [Entity]!
        """
        filter needs exact facet_bestandsname value from Arachne; might be replaced by enum
        """
        entitiesByString(searchString: String, filters: [String]): [Entity]
        locatedEntities(id: ID!): [Entity]!
        entitiesByLocations(ids: [ID]!): [[Entity]]!
        place(id: ID!): Place
        places: [Place]!
    }
`;

module.exports = typeDefs;