const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const publicKeyPath = process.env.PUBLIC_KEY_PATH || 'keys/public_key.pem'; // Ensure this path is correct
const partnerId = "NlRJUE5OUk";
const clientId = "U1BSX05YVF91YXRfOTc3YThmYmJiY2VmNjU4Nw==";

class SprintNxtService {
    constructor() {
        this.encryptedAESKeyBase64 = '';
    }

    loadPublicKey() {
        try {
            const publicKeyPEM = fs.readFileSync(path.resolve(__dirname, publicKeyPath), 'utf-8');
            return crypto.createPublicKey({
                key: publicKeyPEM,
                format: 'pem',
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
        try {
            return crypto.publicEncrypt({
                key: rsaPublicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, aesKey).toString('base64');
        } catch (error) {
            console.error("Error encrypting AES key with RSA public key:", error);
            throw error;
        }
    }

    encryptPayload(payload, aesKey) {
        try {
            const cipher = crypto.createCipheriv('aes-256-ecb', aesKey, Buffer.alloc(0)); // Use Buffer.alloc(0) for no IV
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
            return this.sendEncryptedData(encryptedPayload);
        } catch (error) {
            console.error("Error in encryptAndSendData:", error);
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
            console.log("Response Body: ", response.data);
            return response.data;
        } catch (error) {
            console.error("Error during HTTP request:", error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

const app = express();
app.use(express.json());

const sprintNxtService = new SprintNxtService();

app.post('/payout', async (req, res) => {
    const payload = req.body;
    try {
        const response = await sprintNxtService.encryptAndSendData(JSON.stringify(payload));
        console.log("Payload: " + JSON.stringify(payload, null, 2));
        res.status(200).json(response);
    } catch (error) {
        console.error("Error in /payout route:", error);
        res.status(400).send("Error: " + error.message);
    }
});

app.post('/payoutv2', async (req, res) => {
    const requestBody = req.body;
    console.log("Request Body --->>>>> ", JSON.stringify(requestBody.body, null, 2));
    console.log("Key --->>>>> ", requestBody.key);

    try {
        const response = await sprintNxtService.sendEncryptedData(requestBody);
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error("Error in /payoutv2 route:", error);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send("Error occurred: " + error.message);
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
