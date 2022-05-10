const playwright = require('playwright');
const express = require('express');
const { request, response } = require('express');
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
var Datastore = require('nedb');

var imageURLdivElementOfNewestPost = '#react-root > section > main > article > div:nth-child(3) > div > div:nth-child(1) > div:nth-child(1) > a';
var userInformationDivElement = 'div.e1e1d > div > span > a';
var emptyHeartIcon = 'section >span > button > div >span > svg[fill="#262626"]';
var loginErrorMessageTooManyLogins = 'p[data-testid="login-error-message"]';

var dbActions = new Datastore({ filename: 'dbActions.db' , autoload: true });
var dbUsers = new Datastore({ filename: 'dbUsers.db' , autoload: true });

dbActions.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbUsers.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbUsers.findOne({ username: 'sneaker_mania_berlin' }, function(err, doc) {
    console.log('Found User:', doc.username);
});

//dbActions.findOne({ username: 'sneaker_mania_berlin' }, function(err, doc) {
//    console.log('Found Action:', doc.username);
//});




app.post('/api', (request, response) => {
    const userData = request.body;
    const username = userData.username;
    const password = userData.password;
    const arrayOfSearchTerms = userData.arrayOfSearchTerms;
    var timestampActionsStarted = Date.now();

    dbObjectUsers = {
        created_at: timestampActionsStarted,
        username: request.body.username,
        password: request.body.password,
    }

    dbUsers.insert(dbObjectUsers);

    async function main() {
        const browser = await playwright.chromium.launch({
            headless: false // setting this to true will not run the UI
        }); 
        const page = await browser.newPage();
        await page.goto('https://www.instagram.com/');
        await page.waitForTimeout(2000);
        await page.click('body > div.RnEpo.Yx5HN._4Yzd2 > div > div > button.aOOlW.bIiDR');
        await page.waitForTimeout(2000);
        await page.type('#loginForm > div > div:nth-child(1) > div > label > input', username);
        await page.type('#loginForm > div > div:nth-child(2) > div > label > input', password);
        await page.click('#loginForm > div > div:nth-child(3)');
        await page.waitForSelector('input[aria-label="Sucheingabe"]');

        // check for login error too many login requests
        if (await page.$(loginErrorMessageTooManyLogins) !== null) {
            var errorMessage = 'too many login or your password is not correct';
            console.log(errorMessage);
            var feedback = "failed";
        } else {
            var feedback = "success";
        }

        var maxAmountOfAction = 15;
        var maxAmountOfActionMinusOne = maxAmountOfAction - 1;
        var amountOfActionsDone = 0;
        for(i=1; amountOfActionsDone<=maxAmountOfActionMinusOne; i++){

            if (i != 1) {
                // wait random amount of seconds 
                const minMiliSeconds = 5000;
                const maxMiliSeconds = 10000;
                await page.waitForTimeout(randomNumber(minMiliSeconds, maxMiliSeconds));
            }

            const searchTerm = getRandomSearchTerm();
            await page.waitForTimeout(4000);
            await page.type('input[type="text"]', searchTerm);
            await page.click('div:nth-child(1)>a[class="-qQT3"]'); 
            // get number of total amount of posts for a certain serachTerm
            await page.waitForSelector(imageURLdivElementOfNewestPost);
            var amountOfTotalPostsForCertainTermCssSelector = 'span[class="g47SY "]';
            if (await page.$(amountOfTotalPostsForCertainTermCssSelector) !== null){
                const amountOfTotalPostsForCertainTerm = await page.$eval(amountOfTotalPostsForCertainTermCssSelector, span => span.textContent);
                console.log('amount of total posts is '+ amountOfTotalPostsForCertainTerm + ' for search term '+ searchTerm);
            } else {
                console.log('no total number appeared on screen');
            }
            // query for newest Image URL's appearing --- Skip the first 9 top results 
            var productURLOfNewestPost = await page.$eval(imageURLdivElementOfNewestPost, div => div.href);
            console.log('productURLOfNewestPost: '+ productURLOfNewestPost);
            // go to post URL and like post if it not already liked
            await page.goto(productURLOfNewestPost);
            
            // check if productURL still exists
            if (await page.$('h2._7UhW9') !== null){
                console.log('post probably does not exists anymore');
            } else {
                var usernameOfInstagramProfile = await page.$eval(userInformationDivElement, div => div.textContent); // get username
                console.log('usernameOfInstagramProfile: '+ usernameOfInstagramProfile);
                var userProfileURL = await page.$eval(userInformationDivElement, div => div.href); // get user profile URL
                console.log('userProfileURL: '+ userProfileURL);
                // click like Button 
                actionType = 'likeByTags';
                if (await page.$(emptyHeartIcon) !== null){
                    await page.click(emptyHeartIcon);
                    console.log("Post liked");
                    amountOfActionsDone++;
                    var timestampLastLikeAction = Date.now();
                    dbObjectActions = {
                        created_at: timestampLastLikeAction,
                        username: request.body.username,
                        searchTerms: request.body.arrayOfSearchTerms,
                        seachTermUsed: searchTerm,
                        usernameOfInstagramProfile: usernameOfInstagramProfile,
                        action: {
                            timestampLastLikeAction: timestampLastLikeAction,
                            actionType: actionType,
                            url: productURLOfNewestPost,
                            userProfileURL: userProfileURL,
                            amountOfActionsDone: amountOfActionsDone
                        }
                    }
                        
                    dbActions.insert(dbObjectActions);
                    console.log('Amount of Actions: '+ amountOfActionsDone);
                } else {
                    console.log("Post was already liked");
                }
            }
        }
        // get random element from Array -- START 
        function getRandomSearchTerm() {
            var randomSerchTermWithoutHashtag = arrayOfSearchTerms[Math.floor(Math.random()*arrayOfSearchTerms.length)];
            var randomSerchTerm = '#'+randomSerchTermWithoutHashtag;
            return randomSerchTerm;
        }
        // get random element from Array -- END
        // function to wait for random amount of seconds --START
        function randomNumber(min, max){
            min = Math.ceil(min);
            max = Math.floor(max);
            const randomAmountOfSeconds = Math.floor(Math.random() * (max - min)) + min;
            console.log('Random seconds waiting: '+randomAmountOfSeconds);
            return randomAmountOfSeconds;
        }
        // function to wait for random amount of seconds --END

        await browser.close();
        var timestampActionsEnded = Date.now();
        await response.json({
            feedback,
            created_at: timestampActionsStarted, 
            actions_ended: timestampActionsEnded,
            dbObjectUsers,
            amountOfActionsDone,
            status: "success"
        });
        await browser.close();
    }
    main();
});



