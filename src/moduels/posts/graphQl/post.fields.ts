import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import postServices from "../post.services";
import { postType } from "./post.type";










class PostFields {
    constructor() { }
    query = () => {
        return {


            getPosts: {
                type: new GraphQLList((postType)),
                resolve: postServices.getPostsGQL
            }
        }
    }

}
export default new PostFields()






























