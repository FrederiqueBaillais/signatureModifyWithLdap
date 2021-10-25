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

/*function remplacementDansFichier() {
    const optionsReplace = {
        files: './abcde.txt',
        from: 'essai',
        to: 'test',
    };
    // remplacement asynchrone d'un seul fichier
    try {
        const results = await replaceInFile(optionsReplace);
        console.log('Replacement results:', results);
    }
    catch (error) {
        console.error('Error occurred:', error);
    }
    return 1;
}*/

function remplacementDansFichier(someFile) {
    const regTest = '$userName';
    const regexName = new RegExp('$', 'userName', 'g');
    const regexTest = new RegExp('\$' + 'userName', 'g');
    //const regexTitle = new RegExp('userTitle', 'g');
    //const regexPhone = new RegExp('\$' + 'userPhone', 'g');
    //const regexPhoneFormat = new RegExp('userPhoneFormat', 'g');
    //const regexGSM = new RegExp('$' + 'userGSM', 'g');
    //const regexGSMFormat = new RegExp('$' + 'userGSMFormat', 'g');
    console.log("regex = " + regexTest);

    fs.readFile(someFile, 'utf8', function (err, data) {
        if (err) console.log(err);

        console.log("regex existe ? = " + regTest.match(regexName));


        let result = data.replace(regexTest, 'bidulle');
        //let result2 = data.split(regexDollar);
        //let result2 = data.replace(/\$/, '');

        fs.writeFile(someFile, result, 'utf8', function (err) {
            if (err) return console.log(err);
            console.log('result1');
        });

        /*fs.writeFile(someFile, result2, 'utf8', function (err) {
            if (err) return console.log(err);
            console.log('result2');
        });*/
    });
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