let fs = require('fs');


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

function remplaceData(signatureNameHtm, userName, userTitle, userPhone, userGSM) {
    fs.createWriteStream(signatureNameHtm);

    signatureNameHtm.replace('$userName', userName);
    signatureNameHtm.replace('$userTitle', userTitle);

    if (userPhone == '') {
        signatureNameHtm.replace('$userPhone', '');
        signatureNameHtm.replace('$userPhoneFormat', '');
    } else {
        signatureNameHtm.replace('$userPhone', userPhone);
        signatureNameHtm.replace('$userPhoneFormat', normalizePhone(userPhone));
    }

    if (userGSM == '') {
        signatureNameHtm.replace('$userGSM', '');
        signatureNameHtm.replace('$userGSMFormat', '');
    } else {
        signatureNameHtm.replace('$userGSM', userGSM);
        signatureNameHtm.replace('$userGSMFormat', normalizeGSM(userGSM));
    }
    console.log('remplaceData');
    return null;
}

function remplaceInfos(fileToChange, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat) {
    // remplacement des informations dans le fichier .txt
    fs.readFile(fileToChange, 'utf8', (err, data) => {
        if (err) console.log(err);

        //let result = data.replace("$", "");                                                // retire bien les $
        let result2 = data.replace(["$userName", "$userTitle", "$userPhoneFormat", "$userPhone", "$userGSMFormat", "$userGSM"], [userName, userTitle, userPhoneFormat, userPhone, userGSMFormat, userGSM]);

        /*fs.writeFileSync(fileToChange, result, 'utf8', function (err) {
            if (err) return console.log(err);
            console.log('fileTxt remplacement dollar ok');
        });*/

        //console.log("result2 = " + result2);

        fileToChange = fs.writeFileSync(fileToChange, result2, 'utf8', "w+", function (err) {
            if (err) return console.log(err);
            console.log('fileTxt remplacement information ok');
        });
    });
}


function remplacementDansFichier(fileTxt, fileHtm, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat) {
    remplaceInfos(fileTxt, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat);
    remplaceInfos(fileHtm, userName, userTitle, userPhone, userPhoneFormat, userGSM, userGSMFormat);

}

function downloadFile() {

}


module.exports = {
    normalizePhone,
    normalizeGSM,
    remplaceData,
    remplacementDansFichier,
    downloadFile
}