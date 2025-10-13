"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerCloud = exports.StorageEnum = exports.fileValidation = void 0;
const multer_1 = __importDefault(require("multer"));
const classError_1 = require("../utils/classError");
const os_1 = __importDefault(require("os"));
const zod_1 = require("zod");
exports.fileValidation = {
    image: ["image/png", "image/jpeg", "image/jpg"],
    video: ["video/m4"],
    audio: ["audio/mpeg", "audio/mp3"],
    file: ["application/pdf", "application/word", "application/vnd.openxmlformats-officedoucment.wordprocess.doucment"]
};
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["disk"] = "disk";
    StorageEnum["cloud"] = "cloud";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
const multerCloud = ({ fileTypes = exports.fileValidation.image, storageType = StorageEnum.cloud, maxSize = 5, } = {}) => {
    const storage = storageType === StorageEnum.cloud ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        destination: os_1.default.tmpdir(),
        filename(req, file, cb) {
            cb(null, `${(0, zod_1.uuidv4)()}_${file.originalname}`);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (fileTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            return cb(new classError_1.AppError("invalid file type ..", 400));
        }
    };
    const upload = (0, multer_1.default)({ storage, limits: { fileSize: 1024 * 1024 * maxSize }, fileFilter });
    return upload;
};
exports.multerCloud = multerCloud;
