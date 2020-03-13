require('dotenv').config();

const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const createBot = require('./bot/createBot');
const createBotAdapter = require('./bot/createBotAdapter');
const userStore = require('./userStore');
const generateDirectLineToken = require('./utils/generateDirectLineToken');

const { MICROSOFT_APP_ID, MICROSOFT_APP_PASSWORD, DIRECT_LINE_SECRET, AAD_CLIENT_ID, AAD_CLIENT_SECRET, SESSION_SECRET } = process.env;

// Converts from user -> user ID
passport.serializeUser((user, done) => {
    done(null, user.oid);
});

// Converts from user ID -> user
passport.deserializeUser(async (oid, done) => {
    const user = await userStore.findUserByOidAsync(oid);
    done(null, user);
});

// Set up passport OIDC strategy
const strategy = new OIDCStrategy({
    identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    clientID: AAD_CLIENT_ID,
    clientSecret: AAD_CLIENT_SECRET,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: 'http://localhost:3000/redirect',
    allowHttpForRedirectUrl: true, // allows for localhost testing
    validateIssuer: false, // allow users from all tenants to sign in
    scope: ['profile'],
}, async function(iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) {
    // Find user in user store (and add if not found)
    const user = await userStore.findUserByOidAsync(profile.oid);
    if (!user) {
        console.info('User not found, registering now');
        const newUser = { ...profile, accessToken };
        await userStore.addUserAsync(newUser);
        return done(null, newUser);
    }

    console.info(`Found user: ${JSON.stringify(user)}`);
    return done(null, user);
});
passport.use(strategy);

// Create express app
const app = express();
app.set('view engine', 'ejs');

// Set up passport with express
app.use(expressSession({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static('public'));

// Root page
app.get('/',
    (req, res, next) => {
        // Ensure authenticated
        if (req.isAuthenticated()) { return next(); }
        console.info('not authenticated, redirecting to /login');
        res.redirect('/login');
    },
    async (req, res) => {
        // Authenticated
        console.info('authenticated, sending view');

        // Get user-specific DirectLine token
        // TODO: Cache the DirectLine token instead of generating a new one every time
        const dlSecret = DIRECT_LINE_SECRET;
        const userId = req.user.oid;
        const dlToken = await generateDirectLineToken(dlSecret, userId);

        // Render index view, passing DirectLine token for WebChat rendering
        res.render('pages/index', { dlToken });
    }
);

// Login route, which will redirect to login page
app.get('/login',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    // (req, res) => {
    //     res.redirect('/');
    // }
);

// OAuth2 redirect route
app.get('/redirect',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }  
);

// Bot messaging route
// TODO: consider passing UserStore into bot
const botAdapter = createBotAdapter(MICROSOFT_APP_ID, MICROSOFT_APP_PASSWORD);
const bot = createBot();
app.post('/api/messages', (req, res) => {
    botAdapter.processActivity(req, res, (context) => bot.run(context));
});

// Start server
const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}`));