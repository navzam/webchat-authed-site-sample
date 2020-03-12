const fetchJSON = require('./fetchJSON');

// Generates a new Direct Line token given the secret and user ID
module.exports = async function generateDirectLineToken(secret, userId) {
    const directLineResponse = await fetchJSON('https://directline.botframework.com/v3/directline/tokens/generate', {
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            User: { Id: userId },
        }),
    });

    return directLineResponse.token;
}