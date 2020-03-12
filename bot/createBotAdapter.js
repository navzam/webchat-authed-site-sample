const { BotFrameworkAdapter } = require('botbuilder');

function createBotAdapter(appId, appPassword) {
    const adapter = new BotFrameworkAdapter({
        appId: appId,
        appPassword: appPassword,
    });

    return adapter;
}

module.exports = createBotAdapter;