"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendShipModel = exports.FriendShipEnum = void 0;
const mongoose_1 = require("mongoose");
var FriendShipEnum;
(function (FriendShipEnum) {
    FriendShipEnum["Pending"] = "pending";
    FriendShipEnum["Accepted"] = "accepted";
    FriendShipEnum["Rejected"] = "rejected";
})(FriendShipEnum || (exports.FriendShipEnum = FriendShipEnum = {}));
const friendShipSchema = new mongoose_1.Schema({
    requestFromId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    requestToId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(FriendShipEnum),
        default: FriendShipEnum.Pending,
    },
}, {
    timestamps: true,
});
friendShipSchema.index({ requestFromId: 1, requestToId: 1 }, { unique: true });
exports.FriendShipModel = (0, mongoose_1.model)("FriendShip", friendShipSchema);
