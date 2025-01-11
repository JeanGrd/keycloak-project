// Importation des modules nécessaires
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const path = require('path');

// Initialisation de l'application Express et du magasin de session en mémoire
const app = express();
const memoryStore = new session.MemoryStore();

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuration de Keycloak
app.use(session({
    secret: 'KWhjV<T=-*VW<;cC5Y6U-{F.ppK+])Ub', // Clé secrète pour la session
    resave: false, // Évite de sauvegarder la session si aucune modification n'a été faite
    saveUninitialized: true, // Sauvegarde la session même si elle est vide
    store: memoryStore, // Utilisation du magasin de session en mémoire
}));

const keycloak = new Keycloak({store: memoryStore}); // Initialisation de Keycloak

// Middleware Keycloak pour gérer les routes protégées et les déconnexions
app.use(keycloak.middleware({
    logout: '/logout', // Route de déconnexion
    admin: '/', // Route d'administration
}));

// Liste des permissions (Role, Permission)
const permissions = [
    {role: 'C1', action: 'L1'}, {role: 'C2', action: 'L2'}, {role: 'C3', action: 'L3'},
    {role: 'C1', action: 'E1'}, {role: 'C2', action: 'E2'}, {role: 'C3', action: 'E3'},
    {role: 'R1', action: 'V1'}, {role: 'R2', action: 'V2'}, {role: 'R3', action: 'V3'},
    {role: 'Ens', action: 'L1'}, {role: 'Ens', action: 'L2'}, {role: 'Ens', action: 'L3'},
];

// Fonction pour obtenir les permissions d'un utilisateur à partir de ses rôles
function getUserPermissions(roles) {
    return permissions
        .filter(permission => roles.includes(permission.role))
        .map(permission => permission.action);
}

// Route d'accueil
app.get('/', keycloak.protect(), (req, res) => {
    const tokenContent = req.kauth.grant.access_token.content; // Récupération du contenu du jeton d'accès Keycloak

    // Extraction des informations utilisateur depuis le jeton
    const user = {
        name: tokenContent.name || 'Utilisateur Anonyme',
        email: tokenContent.email || 'Email non fourni',
        username: tokenContent.preferred_username || 'Inconnu',
        roles: tokenContent.realm_access ? tokenContent.realm_access.roles : [],
    };

    // Obtention des permissions de l'utilisateur
    user.permissions = getUserPermissions(user.roles);

    // Rendu de la vue 'home' avec les informations utilisateur
    res.render('home', {user});
});

// Route pour lire les données d'une UE spécifique
app.get('/asset11/lire/:ue', (req, res, next) => {
    const ue = req.params.ue; // Récupération de l'UE depuis les paramètres
    const permission = `asset-11:L${ue}`; // Construction de la permission requise
    keycloak.enforcer([permission])(req, res, next); // Vérification des permissions avec Keycloak
}, (req, res) => {
    const ue = req.params.ue;
    res.render('tableRead', {title: `UE ${ue} - Lire`, ue}); // Rendu de la vue
});

// Route pour écrire des données dans une UE spécifique
app.get('/asset11/ecrire/:ue', (req, res, next) => {
    const ue = req.params.ue; // Récupération de l'UE depuis les paramètres
    const permission = `asset-11:E${ue}`; // Construction de la permission requise
    keycloak.enforcer([permission])(req, res, next); // Vérification des permissions avec Keycloak
}, (req, res) => {
    const ue = req.params.ue;
    res.render('tableWrite', {title: `UE ${ue} - Écrire`, ue}); // Rendu de la vue
});

// Route pour valider des données dans une UE spécifique
app.get('/asset11/valider/:ue', (req, res, next) => {
    const ue = req.params.ue; // Récupération de l'UE depuis les paramètres
    const permission = `asset-11:V${ue}`; // Construction de la permission requise
    keycloak.enforcer([permission])(req, res, next); // Vérification des permissions avec Keycloak
}, (req, res) => {
    const ue = req.params.ue;
    res.render('tableValidate', {title: `UE ${ue} - Valider`, ue}); // Rendu de la vue
});

// Route de déconnexion
app.get('/logout', (req, res) => {
    // Construction de l'URL de déconnexion de Keycloak
    const keycloakLogoutUrl = keycloak.logoutUrl({
        redirectUri: 'http://localhost:3000/', // URL de redirection après déconnexion
    });

    // Redirection vers l'URL de déconnexion
    res.redirect(keycloakLogoutUrl);
});


// Gestionnaire 404
app.use((req, res) => {
    res.status(404).send('Page non trouvée'); // Envoi d'un message d'erreur pour les routes inexistantes
});

// Démarrer le serveur
const PORT = 3000; // Port d'écoute
app.listen(PORT, () => {
    console.log(`Le serveur fonctionne sur http://localhost:${PORT}`);
});
