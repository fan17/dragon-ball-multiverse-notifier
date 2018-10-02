var axios = require('axios');
var cheerio = require('cheerio');
var aws = require('aws-sdk');
var s3 = new aws.S3();

const S3_BUCKET_NAME = 'dragon-ball-multiverse-notifier';
const S3_FILE_NAME = 'last-call.json';
const SEND_MAIL_FUNCTION_NAME = 'dragon-ball-multiverse-new-page-send-email-notification';
const WEBSITE_ADDRESS = 'http://www.dragonball-multiverse.com';

exports.handler = async (event) => {
    log('START');
    let lastSavedPage = await getLastSavedPage();
    
    if (await newPageExists(lastSavedPage)) {
        const newPageLink = await getNextPageLink(lastSavedPage);
        callEmailNotification(newPageLink);
    }

    try {
        const lastPage = await getLastPage(lastSavedPage);
        if (lastPage != lastSavedPage) {
            await saveS3(lastPage);
        }
    } catch (e) {
    }

    log('FINISH');
};

function getLastSavedPage() {
    return new Promise((resolve,reject) => {
        s3.getObject({
            Bucket: S3_BUCKET_NAME,
            Key: S3_FILE_NAME
        }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.Body.toString()).link);
            }
        });
    });
}

async function newPageExists(link) {
    try {
        await getNextPageLink(link);
        return true;
    } catch (e) {
        return false;
    }
}

function getNextPageLink(link) {
    return axios
        .get(link)
        .then((response) => {
            if(response.status === 200) {
                const $ = cheerio.load(response.data);
                const nextPageLink = $('.navigation a[rel="next"]').first().attr('href');
                if (typeof nextPageLink === 'undefined') {
                    throw 'There is not next page';
                }
                return  WEBSITE_ADDRESS + nextPageLink;
            }
        }, (error) => {
            throw 'Error';
        });
}

function getLastPage(link) {
    return axios
        .get(link)
        .then((response) => {
            if(response.status === 200) {
                const $ = cheerio.load(response.data);
                const lastPageLink = $('.navigation a[rel="last"]').first().attr('href');
                if (typeof lastPageLink === 'undefined') {
                    throw 'There is not last page';
                }
                return  WEBSITE_ADDRESS + lastPageLink;
            }
        }, (error) => {
            throw 'Error';
        });
}

function saveS3(link) {
    return new Promise((resolve,reject) => {
        s3.putObject({
             Bucket: S3_BUCKET_NAME,
            Key: S3_FILE_NAME,
            Body: JSON.stringify({ link })
        }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                log('Last link is updated.');
                resolve();
            }
        });
    });
}

function callEmailNotification(link) {
    var lambda = new aws.Lambda();
    var params = {
      FunctionName: SEND_MAIL_FUNCTION_NAME, 
      InvocationType: "Event", 
      LogType: "Tail", 
      Payload: JSON.stringify({ link }),
     };
     lambda.invoke(params, function(err, data) {
       if (err) {
           log('Email notification error: ' + err);
       }
     });
}

function log(text) {
    console.log(text + ' ' + '(' + getTime() + ')')
}

function getTime() {
    return (new Date).toLocaleString();
}
