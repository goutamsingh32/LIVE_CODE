
const { decryptData, encryptData } = require('./backendHelper');

const axios = require('axios');

const API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const API_KEY = 'be3f268cf2mshfd6d50bab0643b4p1f7246jsn1ffe3f8ea652';
const API_HOST = 'judge0-ce.p.rapidapi.com';

/**
 * Compile and execute code
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @returns 
 */
const codeSubmissionHandler = async (req, res) => {
    try {
        if (!(req.body && Object.entries(req.body).filter(Boolean).length)) {
            return res.status(400).json({ status: 'failure', message: 'Invalid parameters - payload' });
        }

        /**
         * @type {{language_id: number, source_code: string, stdin: string, token}}
         */
        const { language_id, source_code, stdin, token } = req.body;
        const sourceCodeDecrypted = decryptData(source_code);
        const tokenDecrypted = token ? decryptData(token) : null;
        const stdinDecrypted = stdin ? decryptData(stdin) : null;


        let apiTokenForSubmissionReq = null;

        if (!tokenDecrypted) {
            //API for create submission
            const data = await axios.default.request({
                method: 'POST',
                url: API_URL,
                params: { base64_encoded: "true", fields: "*" },
                headers: {
                    "content-type": "application/json",
                    "Content-Type": "application/json",
                    "X-RapidAPI-Host": API_HOST,
                    "X-RapidAPI-Key": API_KEY
                },
                data: {
                    language_id,
                    source_code: Buffer.from(sourceCodeDecrypted, 'utf-8').toString('base64'),
                    stdin: stdin ? Buffer.from(stdinDecrypted, 'utf-8').toString('base64').toString('base64') : null
                }
            })
            apiTokenForSubmissionReq = data?.token;
        } else {
            apiTokenForSubmissionReq = tokenDecrypted;
        }

        //API call for Get Submission
        const submissionsResponse = await axios.default.request({
            method: 'GET',
            url: API_URL + '/' + apiTokenForSubmissionReq,
            params: { base64_encoded: true, fields: "*" },
            headers: {
                "X-RapidAPI-Host": API_HOST,
                "X-RapidAPI-Key": API_KEY
            }
        })

        submissionsResponse.data['token'] = submissionsResponse.data['token'];
        return res.status(200).json({ status: 'succcess', message: 'Execution completed', data: submissionsResponse.data });
    } catch (error) {
        console.log('[codeSubmissionHandler]', error);
        return res.status(500).json({ status: 'failure', message: 'Internal server error', error: error.message });
    }
}

module.exports = { codeSubmissionHandler }