"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async (mailOptions) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.PASSWORD_EMAIL,
        },
    });
    const info = await transporter.sendMail({
        from: `"MY Sokkar Media App" <${process.env.MY_EMAIL}>`,
        ...mailOptions,
    });
    console.log("Message sent:.........................", info.messageId);
};
exports.sendEmail = sendEmail;
const generateOTP = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateOTP = generateOTP;
