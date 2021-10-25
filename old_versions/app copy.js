// variables required
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const debug = require('debug');
const nodeSSPI = require('node-sspi');
const formidable = require('formidable');
const cors = require('cors');
const url = require('url');
const ldap = require('ldapjs');

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
            console.log(req.connection.user + ' authenticated!\n');
            currentUser = req.connection.user.match(/WIN.(\w{3})/i)[1];
            console.log("currentUserDeNodeSSPIObj = " + currentUser);
            console.log(currentUser + ' authenticated!');
            return currentUser;
        }
    })
});

app.get('/', (req, res, next) => {
    let listeUser = []; // récupère les informations récupérées via le LDAP
    let infosCurrentUser = {};

    console.log("test = " + currentUser);
    // retourne les infos de ldap en fonction de l'utilisateur en cours
    let opts = {
        filter: '(&(objectCategory=Person)(sAMAccountName=' + currentUser + '))',
        port: ldap_port,
        scope: 'sub',
        attributes: ['givenname', 'sn', 'description', 'telephoneNumber', 'mobile']
    };

    console.log("opts.filter / opts.port = " + opts.filter + " / " + opts.port);

    // On se connect en tant que "ldap_user"
    client.bind(ldap_user, ldap_pass, function (err, req) {

        console.log("ldap_user / ldap_pass = " + ldap_user + " / " + ldap_pass);

        // on fait une recherche dans "base_dn" avec les options "opts"
        client.search(base_dn, opts, function (err, search) {

            console.log("base_dn / opts = " + base_dn + " / " + opts);

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

                console.log("infosCurrentUser.sn = " + infosCurrentUser.sn);

                // On sauvegarde les données de chaque entrée dans le tableau "listeUser"
                listeUser.push(infosCurrentUser);

                listeUser.forEach(element => {
                    console.log(element);
                });

                return infosCurrentUser;
            });

            console.log("infosCurrentUser.sn = " + infosCurrentUser.sn);

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
    console.log('templateFromHtml = ' + templateFromHtml);

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

function normalizePhone(phone) { //normalize string and remove all unnecessary characters
    //check if number length equals to 10
    if (phone.length == 11) {
        //reformat and return phone number
        return phone.replace(/^\+?(\d{2})(\d{2})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
    }

    return null;
}

function normalizeGSM(phone) { //normalize string and remove all unnecessary characters
    //check if number length equals to 10
    if (phone.length == 12) {
        //reformat and return phone number
        return phone.replace(/^\+?(\d{2})(\d{3})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
    }

    return null;
}

function replaceData(template, userName, userTitle, userPhone, userGSM) {
    template.replace('$userName', userName);
    template.replace('$userTitle', userTitle);

    if (userPhoneTemplate == '') {
        template.replace('$userPhone', '');
        template.replace('$userPhoneFormat', '');
    } else {
        template.replace('$userPhone', userPhone);
        template.replace('$userPhoneFormat', normalizePhone(userPhone));
    }

    if (userGSMTemplate == '') {
        template.replace('$userGSM', '');
        template.replace('$userGSMFormat', '');
    } else {
        template.replace('$userGSM', userGSM);
        template.replace('$userGSMFormat', normalizeGSM(userGSM));
    }
}

app.post('/saveTemplate', (req, res, next) => {
    // enregistre le template choisi avec les données
    const form = formidable({ multiples: true, uploadDir: './' });

    form.parse(req, (err, fields, files) => {

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ fields, files }, null, 2));

        console.log({ fields, files });

        // on récupère les champs nécessaires qui sont envoyées dans le formulaire
        let trigramme = fields.trigramme;
        let userName = fields.userName;
        let userTitle = fields.userTitle;
        let userPhone = fields.userPhone;
        let userGSM = fields.userGSM;
        let template = fields.template;
        let signatureNameHtm = fields.signatureName + '.htm';
        let signatureNameTxt = fields.signatureName + '.txt';
        console.log("trigramme3 = " + trigramme + " / userName3 = " + userName + " / userTitle3 = " + userTitle + " / userPhone3 = " + userPhone + " / userGSM3 = " + userGSM + " / template3 = " + template + " / signatureNameHtm = " + signatureNameHtm + " / signatureNameTxt = " + signatureNameTxt);

        let initialSignatureTemplate = '';
        let signatureTemplateTxt = '';

        console.log('dirname = ' + __dirname);
        let dirname = __dirname;
        let dirnameFull = dirname.replace('D:\\', '\\\\thalassa\\d$\\');
        console.log("dirnameFull = " + dirnameFull);

        switch (template) {// endroit initial du template choisi à modifier avec les bonnes informations
            case 'template_Win':
                initialSignatureTemplate = path.join(dirnameFull + '/template_Win.htm');
                //initialSignatureTemplate = '\\\\thalassa\\d$\\web-repository\\selligentxat\\fbi\\signature\\template_Win.htm';
                signatureTemplateTxt = path.join(dirnameFull + '/template_Win_text.txt');
                //signatureTemplateTxt = path.join('\\\\thalassa\\d$\\web-repository\\selligentxat\\fbi\\signature\\template_Win_text.txt');
                console.log('initialSignatureTemplate = ' + initialSignatureTemplate + ' / signatureTemplateTxt = ' + signatureTemplateTxt);
                break;
            case 'template_WinEvents':
                initialSignatureTemplate = path.join(__dirname + '/template_WinEvents.htm');
                signatureTemplateTxt = path.join(__dirname + '/template_Win_text.txt');
                console.log('initialSignatureTemplate = ' + initialSignatureTemplate + ' / signatureTemplateTxt = ' + signatureTemplateTxt);
                break;
            case 'template_WDC':
                initialSignatureTemplate = path.join(__dirname + '/template_WDC.htm');
                signatureTemplateTxt = path.join(__dirname + '/template_WDC_text.txt');
                console.log('initialSignatureTemplate = ' + initialSignatureTemplate + ' / signatureTemplateTxt = ' + signatureTemplateTxt);
                break;
        }

        // destination du template à l'endroit désiré
        //let destinationFolder = 'C:\\Users\\' + trigramme + '\\AppData\\Roaming\\Microsoft\\Signatures\\';
        let destinationFolder = 'C:\\Downloads\\';
        console.log("destination = " + destinationFolder);
        //let destHtm = path.join(destinationFolder, signatureNameHtm);
        let destHtm = path.join(destinationFolder, signatureNameHtm)
        console.log("destHtm = " + destHtm);
        let destTxt = path.join(destinationFolder, signatureNameTxt);
        console.log("destTxt = " + destTxt);

        // vérifie que le folder qui va recevoir le fichier existe
        if (!fs.existsSync(destinationFolder)) {         // s'il n'existe pas on va le créer
            fs.mkdirSync(destinationFolder);
        }

        fs.copyFile(initialSignatureTemplate, destHtm, (err) => {
            if (err) console.log(err);
            console.log('copyFile de htm');
            //let writerHtml = fs.createWriteStream(signatureNameHtm);
            //writerHtml.replaceData(template, userName, userTitle, userPhone, userGSM);
        });

        fs.copyFile(signatureTemplateTxt, destTxt, (err) => {
            if (err) console.log(err);
            console.log('copyFile de txt');
            //let writerTxt = fs.createWriteStream(signatureNameTxt);
            //writerTxt.replaceData(template, userName, userTitle, userPhone, userGSM);
        });

        // on lance la fonction qui va faire l'upload du fichier sélectionné

    });

    /*console.log('Hey ! I\'m there !');
    res.send("resultat");*/
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