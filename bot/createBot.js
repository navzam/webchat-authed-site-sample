const { ActivityHandler } = require('botbuilder');
const userStore = require('../userStore');

function createBot() {
    const bot = new ActivityHandler();

    bot.onMessage(async (context, next) => {
        // Since the DirectLine token is user-specific, the incoming user ID was automatically set by the Bot Service
        const userId = context.activity.from.id;
        const user = await userStore.findUserByOidAsync(userId);
        await context.sendActivity(`Hi ${user.displayName}`);
        await next();

        // TODO: maybe store data in user state?
    });

    return bot;
}

module.exports = createBot;