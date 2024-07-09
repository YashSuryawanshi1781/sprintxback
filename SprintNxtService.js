const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const publicKeyPath = process.env.PUBLIC_KEY_PATH;
const partnerId = "NlRJUE5OUk";
const clientId = "U1BSX05YVF91YXRfOTc3YThmYmJiY2VmNjU4Nw==";

class SprintNxtService {
    constructor() {
        this.encryptedAESKeyBase64 = '';
    }

    loadPublicKey() {
        try {
            const publicKeyPEM = fs.readFileSync(path.resolve(__dirname, publicKeyPath), 'utf-8')
                .replace('-----BEGIN PUBLIC KEY-----', '')
                .replace('-----END PUBLIC KEY-----', '')
                .replace(/\s/g, '');
            return crypto.createPublicKey({
                key: Buffer.from(publicKeyPEM, 'base64'),
                format: 'der',
                type: 'spki'
            });
        } catch (error) {
            console.error("Error loading public key:", error);
            throw error;
        }
    }

    generateAESKey() {
        return crypto.randomBytes(32); // 256-bit AES key
    }

    encryptAESKeyWithRSAPublicKey(aesKey, rsaPublicKey) {
        return crypto.publicEncrypt(rsaPublicKey, aesKey).toString('base64');
    }

    encryptPayload(payload, aesKey) {
        try {
            const cipher = crypto.createCipheriv('aes-256-ecb', aesKey, null);
            let encryptedData = cipher.update(payload, 'utf8', 'base64');
            encryptedData += cipher.final('base64');
            return JSON.stringify({
                body: {
                    payload: encryptedData,
                    key: this.encryptedAESKeyBase64,
                    partnerId: partnerId,
                    clientid: clientId
                }
            });
        } catch (error) {
            console.error("Error encrypting payload:", error);
            throw error;
        }
    }

    async encryptAndSendData(payload) {
        try {
            const aesKey = this.generateAESKey();
            const publicKey = this.loadPublicKey();
            this.encryptedAESKeyBase64 = this.encryptAESKeyWithRSAPublicKey(aesKey, publicKey);
            const encryptedPayload = this.encryptPayload(payload, aesKey);

            console.log("AES Key (Base64 Encoded): " + aesKey.toString('base64'));
            console.log("Encrypted AES Key (Base64 Encoded): " + this.encryptedAESKeyBase64);

            return await this.sendEncryptedData(encryptedPayload);
        } catch (error) {
            console.error("Error encrypting and sending data:", error);
            throw error;
        }
    }

    async sendEncryptedData(encryptedPayload) {
        const headers = {
            'accept': 'application/json',
            'partnerId': partnerId,
            'client-id': clientId,
            'key': this.encryptedAESKeyBase64,
            'content-type': 'application/hal+json'
        };

        try {
            const response = await axios.post('https://uatnxtgen.sprintnxt.in/api/v1/payout/PAYOUT', encryptedPayload, { headers });
            console.log("Response Content-Type: " + response.headers['content-type']);
            console.log("Response Body: " + response.data);
            return response.data;
        } catch (error) {
            console.error("Error during HTTP request", error);
            throw error;
        }
    }
}

module.exports = SprintNxtService;
