const fs = require('fs');
const replace = require('replace-in-file');
const downloadFile = require('download-file');
const https = require('https');

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

function remplaceInfos(fileToChange, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat) {
    // remplacement des informations dans le fichier .txt
    fs.readFile(fileToChange, 'utf8', (err, data) => {
        if (err) console.log(err);

        //console.log('userGSM = ' + userGSM + ' / userGSMFormat = ' + userGSMFormat);

        //Load the library and specify options
        const options = {
            files: fileToChange,
            from: ["$userName", "$userTitle", "$userPhoneFormat", "$userPhone", "$userGSMFormat", "$userGSM"],
            to: [userName, userTitle, userPhoneFormat, userPhone, userGSMFormat, userGSM],
        };
        replace(options, (error, results) => {
            if (error) {
                return console.error('Error occurred:', error);
            }
            console.log('Replacement results:', results);
        });
    });
}

function remplacementDansFichier(fileTxt, fileHtm, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat) {
    remplaceInfos(fileTxt, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat);
    remplaceInfos(fileHtm, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat);
}


module.exports = {
    normalizePhone,
    normalizeGSM,
    remplacementDansFichier
}