require("dotenv").config();

module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: proecess.env.JWT_EXPIRES_IN
    }
};