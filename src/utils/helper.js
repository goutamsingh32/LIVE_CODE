const { enc, AES, format } = require("crypto-js");


/**
 * Encrypt input data
 * @param {string} data 
 */
const encryptData = (data) => {
    const encryptionKey = enc.Base64.parse(process.env.REACT_APP_ENCRYPTION_KEY);
    const encryptionIV = enc.Base64.parse(process.env.REACT_APP_ENCRYPTION_IV);
    const wordArray = enc.Utf16.parse(data);

    return AES.encrypt(wordArray, encryptionKey, { iv: encryptionIV }).toString(format.Hex);
}

/**
 * Decrypt received encrypted string
 * @param {string} data 
 */
const decryptData = (data) => {
    if (!data) return data;
    const encryptionKey = enc.Base64.parse(process.env.REACT_APP_ENCRYPTION_KEY);
    const encryptionIV = enc.Base64.parse(process.env.REACT_APP_ENCRYPTION_IV);

    return AES.decrypt(format.Hex.parse(data), encryptionKey, { iv: encryptionIV }).toString(enc.Utf16);
}

module.exports = { decryptData, encryptData }
