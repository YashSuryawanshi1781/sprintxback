const express = require('express');
const bodyParser = require('body-parser');
const SprintNxtService = require('./SprintNxtService');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const sprintNxtService = new SprintNxtService();

app.post('/auth/sprintnxt/payout', async (req, res) => {
    const payload = req.body;
    try {
        const response = await sprintNxtService.encryptAndSendData(JSON.stringify(payload));
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(400).send("Error: " + error.message);
    }
});

app.post('/auth/sprintnxt/payoutv2', async (req, res) => {
    const requestBody = req.body;
    console.log("Request Body --->>>>> ", requestBody.body);
    console.log("Key --->>>>> ", requestBody.key);

    try {
        const response = await sprintNxtService.sendEncryptedData(requestBody);
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error(error);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send("Error occurred: " + error.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
