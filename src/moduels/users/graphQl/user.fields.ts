import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { userType } from "./user.type";
import userServices from "../user.services";
import { createUserArgs, getUserArgs } from "./user.args";











class UserFields {
    constructor() { }
    query = () => {
        return {

            getOneUser: {
                type: userType,
                resolve: userServices.getOneUser
            },
            getAllUsers: {
                type: new GraphQLList((userType),


                ),
                resolve: userServices.getUsers
            }
        }
    }



    mutation = () => {
        return {
            createUser: {
                type: userType,
                args: createUserArgs,
                resolve: userServices.createUserGQL

            }
        }
    }


}
export default new UserFields()






























