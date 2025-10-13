"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityQuery = getAvailabilityQuery;
const post_model_1 = require("../DataBase/models/post.model");
function getAvailabilityQuery(req) {
    const userId = req.user?._id;
    return [
        { availabillty: post_model_1.PostAvailabilltyEunm.public },
        { availabillty: post_model_1.PostAvailabilltyEunm.friends, createdBy: userId }
    ];
}
