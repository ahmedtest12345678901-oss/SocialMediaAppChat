
import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderType, IUser } from "../../../DataBase/models/user.model";
import { HydratedDocument } from "mongoose";





export const GenderEnum = new GraphQLEnumType({
  name: "GenderEnum",
  values: {
    male: { value: GenderType.male },
    female: { value: GenderType.female },
  }
});



export const userType = new GraphQLObjectType({
  name: "User",
  fields: {
    _id: { type: GraphQLID },
    userName: {
      type: new GraphQLNonNull(GraphQLString), resolve: (parent: HydratedDocument<IUser>) => {
        return parent.gender == GenderType.male ? "Eng:" + parent.userName : "Eng:" + parent.userName
      }
    },
    email: { type: GraphQLString },
    gender: { type: new GraphQLNonNull(GenderEnum) },
    age: { type: GraphQLInt },
    friends: { type: new GraphQLList(GraphQLID) }
  }
})


































