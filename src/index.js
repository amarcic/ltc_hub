const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const EntityAPI = require('./datasources/entity');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
        entityAPI: new EntityAPI()
    })
});


server.listen().then(({ url }) => {
    console.log(`Server is ready at ${url}`);
});