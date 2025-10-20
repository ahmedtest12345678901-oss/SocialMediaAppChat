import { GraphQLID, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import userFields from "../users/graphQl/user.fields";
import PostServices from "../posts/post.services";
import postFields from "../posts/graphQl/post.fields";


const userss = [
    { id: 1, name: "ali", email: "ali@gamil.com", password: 134, wife: { name: "yara" } },
    { id: 2, name: "Sayed", email: "Sayed@gamil.com", password: 1345, wife: { name: "yara" } },
    { id: 3, name: "Sokkar", email: "Sokkar@gamil.com", password: 134567, wife: { name: "yara" } },
]


const userType = new GraphQLObjectType({
    name: "geTuSER",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        wife: {
            type: new GraphQLObjectType({
                name: "wife",
                fields: {
                    name: { type: GraphQLString },

                }
            })
        }
    }
})

export const schemaGQL = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "Query",
        description: "this is description",
        fields: () => ({
            ...userFields.query(), 
            ...postFields.query(),
        }),
    }),
    mutation: new GraphQLObjectType({
        name: "Mutation",
        fields: () => ({
            ...userFields.mutation(), 
        }),
    }),
});

