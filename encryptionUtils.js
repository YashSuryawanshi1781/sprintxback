// encryptionUtils.js

const crypto = require('crypto');
const fs = require('fs');

function encData(data, publicKeyPath) {
    // Generate AES-256 key
    const key = crypto.randomBytes(32);

    // Encrypt data using AES-256-ECB
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    // Encrypt AES key using RSA public key
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const encryptedKey = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, key);

    // Base64 encode encrypted data and key
    const encodedData = Buffer.from(encryptedData, 'base64').toString('base64');
    const encodedKey = encryptedKey.toString('base64');

    return {
        payload: encodedData,
        key: encodedKey
    };
}

module.exports = {
    encData
};
