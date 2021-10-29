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

function downloadOfFile2(signatureTemplateTxt, destTxt, cb) {
    var file = fs.createWriteStream(destTxt);
    console.log("signatureTemplateTxt = " + signatureTemplateTxt);
    var request = https.get(signatureTemplateTxt, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', (err) => { // Handle errors
        fs.unlink(destTxt); // Delete the file async. (But we don't check the result)
        if (cb) cb('est-ce de ce côté ? = ' + err.message);
    });
};

function downloaderOfOneFile(templateComplete, destination, signatureName) {
    const optionsDownload = {
        directory: destination,
        filename: signatureName
    }

    downloadFile(templateComplete, optionsDownload, function (err) {
        if (err) console.log(err);
        console.log("Youhou");
    })
}

function downloadOfFile(destTxt, destHtm, destinationFolder, signatureNameTxt, signatureNameHtm) {
    downloaderOfOneFile(destTxt, destinationFolder, signatureNameTxt);
    downloaderOfOneFile(destHtm, destinationFolder, signatureNameHtm);
}

function copyFileInRemote(initialFile, destinationFile) {
    //let uploadDir = initialFile;
    // __dirname means relative to script. Use "./data.txt" if you want it relative to execution path.
    fs.readFile(initialFile + "", (error, data) => {
        if (error) {
            throw error;
        }
        console.log(data.toString());
        fs.writeFile(destinationFile, data, (err) => {
            if (err) console.log('writeFile :: ' + err);
        })
    });
}

function linksOnButton(signatureTemplateHtm, signatureTemplateTxt) {
    //window.document.getElementById("btnDownloadHtm").onclick = signatureTemplateHtm;
    //window.document.getElementById("btnDownloadTxt").onclick = signatureTemplateTxt;
}


module.exports = {
    normalizePhone,
    normalizeGSM,
    remplacementDansFichier,
    downloadOfFile,
    downloadOfFile2,
    copyFileInRemote,
    linksOnButton
}