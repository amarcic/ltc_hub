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
        fallsIntoPlace: Place
        containsPlaces: [Place]
        locatedInPlaces: [Place]
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
        MehrteiligeDenkmaeler
        Bauwerke
        Bauwerksteile
        Bilder
        Buecher
        Buchseiten
        Einzelmotive
        Gruppierungen
        Inschriften
        Literatur
        Orte
        Reproduktionen
        Personen
        Rezeptionen
        Sammlungen
        Szenen
        Topographien
        Typen
        dreiDModelle
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
        entitiesMultiFilter( searchString: String, coordinates: [Float], projects: [String], period: String ): [Entity]
        locatedEntities(id: ID!): [Entity]!
        nestedLocatedEntities(id: ID!): [Place]
        entitiesByLocations(ids: [ID]!): [[Entity]]!
        entitiesByPeriod(periodString: String): [Entity]
        entitiesByCoordinates(coordinates: [Float]): [Entity]
        place(id: ID!): Place
        places(ids: [ID]!): [Place]!
    }
`;

module.exports = typeDefs;