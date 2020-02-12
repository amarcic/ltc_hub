const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const EntityAPI = require('./datasources/entity');
const PlaceAPI = require('./datasources/place');
const SubjectAPI = require('./datasources/subject');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
        entityAPI: new EntityAPI(),
        placeAPI: new PlaceAPI(),
        subjectAPI: new SubjectAPI()
    })
});


server.listen().then(({ url }) => {
    console.log(`Server is ready at ${url}`);
});