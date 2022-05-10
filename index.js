const playwright = require('playwright');
const express = require('express');
const { request, response } = require('express');
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
var Datastore = require('nedb');


// URL collection 
const loginURL = 'https://www.instagram.com/';
const tagsURL = 'https://www.instagram.com/explore/tags/';

// CSS variables for selection of elements
var imageURLdivElementOfNewestPost = '#react-root > section > main > article > div:nth-child(3) > div > div:nth-child(1) > div:nth-child(1) > a';
var userInformationDivElement = 'div.e1e1d > div > span > a';
var emptyHeartIcon = 'section >span > button > div >span > svg[fill="#262626"]';
var loginErrorMessageTooManyLogins = 'p[data-testid="login-error-message"]';
var searchTermSuggestionFirstResult = 'div:nth-child(1)>a[class="-qQT3"]';
var clearSearchTermInputIcon = '.coreSpriteSearchClear';
var pageNotFountTitle = '#react-root > section > main > div > div > h2';

// amount Action Variables 
const minMiliSeconds = 5000;
const maxMiliSeconds = 10000;

var errorLimitReached = false;
var maxAmountOfAction = 20;
var maxAmountOfActionMinusOne = maxAmountOfAction - 1;
var amountOfActionsDone = 0;

var searchResultListShown = false; 
var noSearchSuggestionAmountOfTrys = 0;
var amountOfSearchSuggestionTrys = 3;

var amountOfErrosLogged = 0;
var errorLogLimit = 5;


var dbActions = new Datastore({ filename: 'dbActions.db' , autoload: true });
var dbUsers = new Datastore({ filename: 'dbUsers.db' , autoload: true });

dbActions.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbUsers.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

// dbUsers.find({ username: 'sneaker_mania_berlin' }, (err, dbUsersData) => {
//     if (err){
//         response.end();
//         console.log(err);
//         return
//     }
//     console.log('Found User:', dbUsersData[0]);
// });


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
        await page.goto(loginURL);
        await page.waitForTimeout(2000);
        await page.click('body > div.RnEpo.Yx5HN._4Yzd2 > div > div > button.aOOlW.bIiDR');
        await page.waitForTimeout(2000);
        await page.type('#loginForm > div > div:nth-child(1) > div > label > input', username);
        await page.type('#loginForm > div > div:nth-child(2) > div > label > input', password);
        await page.click('#loginForm > div > div:nth-child(3)');
        await page.waitForTimeout(2000);

        // check for login error too many login requests
        if (await page.$(loginErrorMessageTooManyLogins) !== null) {
            var errorMessage = 'too many login or your password is not correct';
            console.log(errorMessage);
            var feedback = "failed";
        } else {
            var feedback = "success";
            // loop over amount of actions
            for (i=1;amountOfActionsDone<=maxAmountOfActionMinusOne;i++){
            
                // check if not too many erros were logged
                if (amountOfErrosLogged>=errorLogLimit){
                    console.log('Amount of Erros that were logged: '+ amountOfErrosLogged);
                    console.log('Browser closed due to too many errors that were logged');
                    var feedback = 'too many errors logged'
                    var timestampActionsEnded = Date.now();
                    var errorLimitReached = true;
                    await browser.close();
                    await response.json({
                        feedback,
                        created_at: timestampActionsStarted, 
                        actions_ended: timestampActionsEnded,
                        dbObjectUsers,
                        amountOfActionsDone,
                        status: "failed"
                    });
                } else {
                
                    // wait random amount of seconds 
                    if (i != 1) {
                        await page.waitForTimeout(randomNumber(minMiliSeconds, maxMiliSeconds));
                    }
                
                    // fetch random searchTerm from SearchTerms array
                    var searchTerm = getRandomSearchTerm();
                    var searchTermWithoutHashtag = searchTerm.substring(1);
                    await page.waitForTimeout(2000);
                
                    // try to open tag result list through typing in the searchTerm inside Search input
                    
                    // ---> if (!errorLimitReached && !searchResultListShown){
                    // --->     for(k=0; noSearchSuggestionAmountOfTrys<amountOfSearchSuggestionTrys; k++){
                    // --->         console.log('Trying to open searchTerms with Typing inside search input field');
                    // --->         await page.type('input[type="text"]', searchTerm);
                    // --->         await page.waitForTimeout(4000);
                    // --->     
                    // --->         // check if searchTerm suggestion dropdown list is showing up
                    // --->         if (await page.$(searchTermSuggestionFirstResult) !== null){
                    // --->             console.log('CHECKPOINT 1');
                    // --->             await page.click(searchTermSuggestionFirstResult);
                    // --->         
                    // --->             // check if page not found error appears
                    // --->             if (await page.$(pageNotFountTitle) !== null){
                    // --->                 console.log('CHECKPOINT 2');
                    // --->                 await page.waitForTimeout(randomNumber(minMiliSeconds, maxMiliSeconds));
                    // --->                 console.log('page not found error no. :'+ noSearchSuggestionAmountOfTrys);
                    // --->                 noSearchSuggestionAmountOfTrys++;
                    // --->                 amountOfErrosLogged++;
                    // --->             } else {
                    // --->                 console.log('CHECKPOINT 3');
                    // --->                 var searchResultListShown = true;
                    // --->             }
                    // --->         }
                    // --->         else {
                    // --->             console.log('CHECKPOINT 4');
                    // --->             var searchTerm = getRandomSearchTerm();
                    // --->             await page.click(clearSearchTermInputIcon);
                    // --->             noSearchSuggestionAmountOfTrys++;
                    // --->             amountOfErrosLogged++;
                    // --->             console.log('No SearchTerm Suggestion showed up');
                    // --->         }
                    // --->     }
                    // ---> }
                
                    // try to open tag result list immediately
                    if (!errorLimitReached && !searchResultListShown){
                        await page.goto(tagsURL+searchTermWithoutHashtag);
                        if (await page.$(imageURLdivElementOfNewestPost)!== null){
                            var searchResultListShown = true;
                        } else if (await page.$(pageNotFountTitle) !== null) {
                            console.log('No Search Results found');
                            amountOfErrosLogged++;
                        }
                    }
                
                    if (searchResultListShown){
                        var searchResultListShown = false;

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
                }
            }
        }

        // get random element from Array -- START 
        function getRandomSearchTerm() {
            var randomSearchTermWithoutHashtag = arrayOfSearchTerms[Math.floor(Math.random()*arrayOfSearchTerms.length)];
            var randomSearchTerm = '#'+randomSearchTermWithoutHashtag;
            return randomSearchTerm;
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
    }
    main();
});



