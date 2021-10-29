// variables required
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const debug = require('debug');
const nodeSSPI = require('node-sspi');
const formidable = require('formidable');
const cors = require('cors');
const url = require('url');
const ldap = require('ldapjs');
const download = require('download-file');
const replaceInFile = require('replace-in-file');

const fctExt = require('./fct.js');
require('dotenv').config();

// variables utilisables globales
const app = express();

// variables de connexion pour le LDAP
let ldap_host = process.env.LDAP_HOST;
let ldap_user = process.env.LDAP_USER;
let ldap_pass = process.env.LDAP_PASS;
let base_dn = process.env.BASE_DN;
let ldap_port = process.env.LDAP_PORT;

// serveur et client ldap
// pour le ldap : port 389
//let client = ldap.createClient({ url: 'ldap://' + ldap_host + '/' + ldap_port });

// serveur et client ldaps (sécurisé)
// pour le ldaps : port 636
tlsOptions = { 'rejectUnauthorized': false }
let client = ldap.createClient({ url: 'ldaps://' + ldap_host + ':' + ldap_port + '/', tlsOptions: tlsOptions });

//ldap.Attribute.settings.guid_format = ldap.GUID_FORMAT_X;
let currentUser;

// variables environnement
let port = process.env.PORT;

// get port from environment and store in Express
app.set('port', port);

app.set('views', path.join(__dirname, 'views'));

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// création du serveur
let server = https.createServer({
    key: fs.readFileSync('c:/rpti/staff.win.be.key'),
    cert: fs.readFileSync('c:/rpti/staff.win.be.cer')
}, app);

// listen on provided port, on all network interfaces
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));        // body-parser est maintenant inclus dans express, on le note ainsi pour pouvoir récupérer les données
app.use(express.static('public'));
app.use((req, res, next) => {                           // cors
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((req, res, next) => {
    var nodeSSPIObj = new nodeSSPI({
        retrieveGroups: false
    })
    nodeSSPIObj.authenticate(req, res, (err) => {
        res.finished || next()
        if (req.connection.user) {
            //console.log(req.connection.user + ' authenticated!\n');
            currentUser = req.connection.user.match(/WIN.(\w{3})/i)[1];
            //console.log("currentUserDeNodeSSPIObj = " + currentUser);
            //console.log(currentUser + ' authenticated!');
            return currentUser;
        }
    })
});

app.get('/', (req, res, next) => {
    let listeUser = []; // récupère les informations récupérées via le LDAP
    let infosCurrentUser = {};

    //console.log("test = " + currentUser);
    // retourne les infos de ldap en fonction de l'utilisateur en cours
    let opts = {
        filter: '(&(objectCategory=Person)(sAMAccountName=' + currentUser + '))',
        port: ldap_port,
        scope: 'sub',
        attributes: ['givenname', 'sn', 'description', 'telephoneNumber', 'mobile']
    };

    //console.log("opts.filter / opts.port = " + opts.filter + " / " + opts.port);

    // On se connect en tant que "ldap_user"
    client.bind(ldap_user, ldap_pass, function (err, req) {

        //console.log("ldap_user / ldap_pass = " + ldap_user + " / " + ldap_pass);

        // on fait une recherche dans "base_dn" avec les options "opts"
        client.search(base_dn, opts, function (err, search) {

            //console.log("base_dn / opts = " + base_dn + " / " + opts);

            search.on('searchRequest', (searchRequest) => {
                console.log('searchRequest: ', searchRequest.messageID);
            });

            // A chaque entrée trouvée, l’événement searchEntry se déclenche
            search.on('searchEntry', function (entry) {
                console.log('entry: ' + JSON.stringify(entry.object));
                infosCurrentUser = {
                    "sn": entry.object.sn,
                    "givenName": entry.object.givenName,
                    "userTitle": entry.object.description,
                    "userPhone": entry.object.telephoneNumber,
                    "userGSM": entry.object.mobile
                }

                //console.log("infosCurrentUser.sn = " + infosCurrentUser.sn);

                // On sauvegarde les données de chaque entrée dans le tableau "listeUser"
                listeUser.push(infosCurrentUser);

                /*listeUser.forEach(element => {
                    console.log(element);
                });*/

                return infosCurrentUser;
            });

            //console.log("infosCurrentUser.sn = " + infosCurrentUser.sn);

            search.on('searchReference', function (referral) {
                console.log('referral: ' + referral.uris.join());
            });
            search.on('error', function (err) {
                console.error('error: ' + err.message);
            });
            // Se déclenche quand la recherche est terminée
            search.on('end', function (result) {     // rend les informations du LDAP pour les mettre dans le formulaire

                //res.render(__dirname + '/views/index.html', { liste: JSON.stringify(listeUser) });
                res.render(__dirname + '/views/index.html', {
                    trigramme: currentUser,
                    givenName: infosCurrentUser.givenName,
                    sn: infosCurrentUser.sn,
                    userTitle: infosCurrentUser.userTitle,
                    userPhone: infosCurrentUser.userPhone,
                    userGSM: infosCurrentUser.userGSM
                });
            });
        });
    });
});

app.get('/getHtmlTemplate', (req, res, next) => {
    // retourne le template choisi par l'utilisateur pour l'afficher en vérification
    let templateFromHtml = req.query.templateName;

    switch (templateFromHtml) {// affichage du template choisi à l'endroit donné dans le formulaire
        case 'template_Win':
            res.sendFile(path.join(__dirname + '/template_Win.htm'));
            break;
        case 'template_WinEvents':
            res.sendFile(path.join(__dirname + '/template_WinEvents.htm'));
            break;
        case 'template_WDC':
            res.sendFile(path.join(__dirname + '/template_WDC.htm'));
            break;
    }
});

app.post('/saveTemplate', (req, res, next) => {
    // enregistre le template choisi avec les données
    const form = formidable({ multiples: true, uploadDir: './' });

    form.parse(req, (err, fields, files) => {

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ fields, files }, null, 2));

        console.log({ fields, files });

        // on récupère les champs nécessaires qui sont envoyées dans le formulaire
        let userName = fields.userName;
        let userTitle = fields.userTitle;
        let userPhone = fields.userPhone;
        if (userPhone != '') { userPhoneFormat = fctExt.normalizePhone(userPhone); } else { userPhoneFormat = ''; }
        let userGSM = fields.userGSM;
        if (userGSM != '') { userGSMFormat = fctExt.normalizeGSM(userGSM); } else { userGSMFormat = ''; }
        let template = fields.template;
        let signatureNameHtm = './public/' + fields.signatureName + '.htm';
        let signatureNameTxt = './public/' + fields.signatureName + '.txt';
        //console.log(userGSM + '/' + userGSMFormat);

        switch (template) {
            case 'template_Win':
                fs.copyFileSync('./template_Win.htm', signatureNameHtm, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template Win htm ok');
                });
                fs.copyFileSync('./template_Win_text.txt', signatureNameTxt, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template Win txt ok');
                });
                break;
            case 'template_WinEvents':
                fs.copyFileSync('./template_WinEvents.htm', signatureNameHtm, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template WinEvents htm ok');
                });
                fs.copyFileSync('./template_Win_text.txt', signatureNameTxt, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template WinEvents txt ok');
                });
                break;
            case 'template_WDC':
                fs.copyFileSync('./template_WDC.htm', signatureNameHtm, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template WDC htm ok');
                });
                fs.copyFileSync('./template_WDC_text.txt', signatureNameTxt, (err) => {
                    if (err) console.log(err);
                    console.log('copie du template WDC txt ok');
                });
                break;
        }

        // Remplacement des informations user récupérées via le LDAP dans le nouveau fichier
        fctExt.remplacementDansFichier(signatureNameTxt, signatureNameHtm, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat)

    });

});

function onError(error) { // Event listener for https server "error" event
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() { // Event listener for https server "listening" event
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
    console.log('listening on port ' + addr.port);
}
