const express = require('express');
const bodyParser = require('body-parser');
const SprintNxtService = require('./SprintNxtService');
const app = express();
const axios = require('axios');
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
        const response = await axios.post(
            'https://uatnxtgen.sprintnxt.in/api/v1/payout/PAYOUT',
            requestBody.body,
            {
                headers: {
                    'accept': 'application/json',
                    'partnerId': 'NlRJUE5OUk',
                    'client-id': 'U1BSX05YVF91YXRfOTc3YThmYmJiY2VmNjU4Nw==',
                    'key': requestBody.key,
                    'content-type': 'application/hal+json'
                }
            }
        );
        
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

module.exports = app;
