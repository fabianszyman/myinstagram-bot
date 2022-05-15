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
var cookiesAcceptCTA = 'body > div.RnEpo.Yx5HN._4Yzd2 > div > div > button.aOOlW.bIiDR';
var usernameInput = '#loginForm > div > div:nth-child(1) > div > label > input';
var passwordInput = '#loginForm > div > div:nth-child(2) > div > label > input';
var loginCTA = '#loginForm > div > div:nth-child(3)';
var searchTermInput = 'input[type="text"]';

var imageURLdivElementOfNewestPost = 'article > div:nth-child(3) > div > div:nth-child(1) > div:nth-child(1) > a';
var userInformationDivElement = 'div.e1e1d > div > span > a';
var emptyHeartIcon = 'section >span > button > div >span > svg[fill="#262626"]';
var loginErrorMessageTooManyLogins = 'p[data-testid="login-error-message"]';
var searchTermSuggestionFirstResult = 'div:nth-child(1)>a[class="-qQT3"]';
var clearSearchTermInputIcon = '.coreSpriteSearchClear';
var pageNotFountTitle = '#react-root > section > main > div > div > h2';

    // action Types variables
    var actionTypes = [
        'followUserByTags',
        'likeByTags',
        'likeByTags'
    ];

    // variables for Follow User Actions
    var instagramNameOfCertainUser = 'div.XBGH5 > h2';
    var amountOfPostOfCertainUser = 'li:nth-child(1) > div > span';
    var amountOfFollowersOfCertainUser = 'li:nth-child(2) > a > div > span';
    var amountOfPeopleCertainUserFollows = 'li:nth-child(3) > a > div > span';
    var followCTA = 'span.vBF20 > button'
    var followCTAUserAlreadyFollowedIcon = 'button>div>div>svg[fill="#262626"]';

// amount Action Variables 
const minMiliSeconds = 5000;
const maxMiliSeconds = 13000;

var errorLimitReached = false;
var userFoundInDbStopAction = false;

var maxAmountOfAction = 150;
var maxAmountOfActionMinusOne = maxAmountOfAction - 1;
var amountOfActionsDone = 0;

var maxAmountOfFollowersACertainUserShouldHave = 10000;

var searchResultListShown = false; 
var noSearchSuggestionAmountOfTrys = 0;
var amountOfSearchSuggestionTrys = 3;

var amountOfErrosLogged = 0;
var errorLogLimit = 5;


var dbActions = new Datastore({ filename: 'dbActions.db' , autoload: true });
var dbStopActions = new Datastore({ filename: 'dbStopActions.db' , autoload: true });
var dbObjectBigUserAccount = new Datastore({ filename: 'dbBigUserAccounts.db' , autoload: true });
var dbUsers = new Datastore({ filename: 'dbUsers.db' , autoload: true });
var dbErrors = new Datastore({ filename: 'dbErrorLogging.db' , autoload: true });

dbActions.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbObjectBigUserAccount.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbUsers.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

dbErrors.loadDatabase(function(err) {
    // Start issuing commands after callback...
});

app.post('/stop', (request, response) => {
    const userNameStopAction = request.body;
    const usernameFromStopAction = userNameStopAction.username;
    var timestampActionsStopped = Math.round((new Date()).getTime() / 1000);;

    dbStopActionEntry = {
        created_at: timestampActionsStopped,
        username: usernameFromStopAction
    }

    dbStopActions.insert(dbStopActionEntry);
    response.json({
        actions_stopped: timestampActionsStopped,
        dbStopActionEntry,
        status: "action was stopped"
    });

});



app.post('/api', (request, response) => {
    const userData = request.body;
    const username = userData.username;
    const password = userData.password;
    const arrayOfSearchTerms = userData.arrayOfSearchTerms;
    var timestampActionsStarted = Math.round((new Date()).getTime() / 1000);;

    dbObjectUsers = {
        created_at: timestampActionsStarted,
        username: request.body.username,
        password: request.body.password,
    }

    dbUsers.insert(dbObjectUsers);

    async function main() {
        try{
            const browser = await playwright.chromium.launch({
                headless: false // setting this to true will not run the UI
            }); 
            const page = await browser.newPage();
            
            // ---> await page.waitForTimeout(500000); // ----> just testig purpose remove before you push
            
            await page.goto(loginURL);
            await page.waitForTimeout(2000);
            await page.click(cookiesAcceptCTA);
            await page.waitForTimeout(2000);
            await page.type(usernameInput, username);
            await page.type(passwordInput, password);
            await page.click(loginCTA);
            await page.waitForTimeout(12000);
            
            // check for login error too many login requests
            if (await page.$(loginErrorMessageTooManyLogins) !== null) {
                var errorMessage = 'too many logins done or your password is not correct';
                console.log(errorMessage);
                var feedback = "failed";
                var timestampActionsEnded = Math.round((new Date()).getTime() / 1000);
                await browser.close();
                await response.json({
                    feedback,
                    created_at: timestampActionsStarted, 
                    actions_ended: timestampActionsEnded,
                    amountOfActionsDone,
                    status: "too many logins done or your password is not correct"
                }); 
            
            } else {
            
                // loop over amount of actions, when amountOfActionsDone is smaller than maxAmountOfActions && user did not stop the script
                for (i=1; (amountOfActionsDone<maxAmountOfActionMinusOne) && (!userFoundInDbStopAction);i++){
                
                    // check if not too many erros were logged
                    if (amountOfErrosLogged>=errorLogLimit){
                        console.log('Amount of Erros that were logged: '+ amountOfErrosLogged);
                        console.log('Browser closed due to too many errors that were logged');
                        var feedback = 'too many errors logged'
                        var timestampActionsEnded = Math.round((new Date()).getTime() / 1000);
                        var errorLimitReached = true;
                        await browser.close();
                        await response.json({
                            feedback,
                            actions_ended: timestampActionsEnded,
                            dbObjectUsers,
                            amountOfActionsDone,
                            status: "error - Browser closed due to too many errors that were logged"
                        });
                    } else { // start Action function
                        
                        // wait random amount of seconds 
                        if (i != 1) {
                            await page.waitForTimeout(randomNumber(minMiliSeconds, maxMiliSeconds));
                        }
            
                        // fetch random actionType form actionsTypes Array
                        var actionType = actionTypes[Math.floor(Math.random()*actionTypes.length)];
                        console.log('Random Action Type selected is '+ actionType);
                    
                        // fetch random searchTerm from SearchTerms array
                        var searchTerm = getRandomSearchTerm();
                        var searchTermWithoutHashtag = searchTerm.substring(1);
                        await page.waitForTimeout(2000);
                    
                        // try to open tag result list immediately
                        if (!errorLimitReached && !searchResultListShown){
                            await page.waitForSelector(searchTermInput);
                            await page.goto(tagsURL+searchTermWithoutHashtag+'/');
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
            
                                // start Action follow User 
                                if (actionType == 'followUserByTags'){
                                    await page.goto(userProfileURL);
                                    if (await page.$(amountOfPostOfCertainUser) !== null){
            
                                        // fetch information from User profile
                                        var timestampUserInfoFetched = Math.round((new Date()).getTime() / 1000);
            
                                        if (await page.$(instagramNameOfCertainUser) !== null){
                                            var userNameThatCertainUserHas = await page.$eval(instagramNameOfCertainUser, h2 => h2.textContent);
                                            console.log('0.userNameThatCertainUserHas: '+ userNameThatCertainUserHas);
                                        }                                    
            
                                        if (await page.$(amountOfPostOfCertainUser) !== null){
                                            var amountOfPostsUserHasString = await page.$eval(amountOfPostOfCertainUser, span => span.textContent);
                                            var amountOfPostsUserHas = parseInt(amountOfPostsUserHasString);
                                            console.log('1.amountOfPostsUserHas: '+ amountOfPostsUserHas);
                                        }
                                        
                                        if (await page.$(amountOfFollowersOfCertainUser) !== null){
                                            var amountOfFollowersUserHasString = await page.$eval(amountOfFollowersOfCertainUser, span => span.title);
                                            var amountOfFollowersUserHas = parseInt(amountOfFollowersUserHasString);
                                            console.log('2.amountOfFollowersUserHas: '+ amountOfFollowersUserHas);
                                        }
            
                                        if (await page.$(amountOfPeopleCertainUserFollows) !== null){
                                            var amountOfPeopleUserFollowsString = await page.$eval(amountOfPeopleCertainUserFollows, span => span.textContent);
                                            var amountOfPeopleUserFollows = parseInt(amountOfPeopleUserFollowsString);
                                            console.log('3.amountOfPeopleUserFollows: '+ amountOfPeopleUserFollows);
                                        }
                            
                                        // check if is already followed 
                                        if (await page.$(followCTAUserAlreadyFollowedIcon) !== null) {
                                            console.log('User ' + userNameThatCertainUserHas + ' is already followed - Follow Action skipped');
                                        }
            
                                        // check if user account is too big due to too many followers
                                        else if (amountOfFollowersUserHas >= maxAmountOfFollowersACertainUserShouldHave) {
                                            console.log('User has more than '+ maxAmountOfFollowersACertainUserShouldHave + 'Followers. Account is too big --> Follow action is skipped');
                                            var timestampLastLikeAction = Math.round((new Date()).getTime() / 1000);
                                            dbObjectBigUserAccount = {
                                                username: request.body.username,
                                                searchTerms: request.body.arrayOfSearchTerms,
                                                seachTermUsed: searchTerm,
                                                action: {
                                                    timestampLastLikeAction: timestampLastLikeAction,
                                                    userData: {
                                                        created_at: timestampUserInfoFetched,
                                                        username: userNameThatCertainUserHas,
                                                        amount_of_posts: amountOfPostsUserHas,
                                                        amount_of_followers: amountOfFollowersUserHas,
                                                        amount_of_people_user_follows: amountOfPeopleUserFollows
                                                    }
                                                }
                                            }
                                            dbObjectBigUserAccount.insert(dbObjectBigUserAccount);
                                            console.log(dbObjectBigUserAccount);
                            
                                        }
                                        
                                        // check if follow action CTA appears on screen && check if amountOfFollowersUserHas is smaller than the max Number he should have more 
                                        else if (await page.$(followCTA) !== null && amountOfFollowersUserHas < maxAmountOfFollowersACertainUserShouldHave){
                                            await page.click(followCTA);
                                            console.log('User '+ userNameThatCertainUserHas + ' was followed');
                                            amountOfActionsDone++;
                                            var timestampLastLikeAction = Math.round((new Date()).getTime() / 1000);
                                            dbObjectActionFollow = {
                                                created_at: timestampLastLikeAction,
                                                username: request.body.username,
                                                searchTerms: request.body.arrayOfSearchTerms,
                                                seachTermUsed: searchTerm,
                                                action: {
                                                    timestampLastLikeAction: timestampLastLikeAction,
                                                    actionType: actionType,
                                                    amountOfActionsDone: amountOfActionsDone,
                                                    userData: {
                                                        created_at: timestampUserInfoFetched,
                                                        username: userNameThatCertainUserHas,
                                                        amount_of_posts: amountOfPostsUserHas,
                                                        amount_of_followers: amountOfFollowersUserHas,
                                                        amount_of_people_user_follows: amountOfPeopleUserFollows
                                                    }
                                                }
                                            }
                                            dbActions.insert(dbObjectActionFollow);
                                            console.log(dbObjectActionFollow); 
                                        }
                                    }
                                }
                            
                                // start Action click like Button 
                                if (actionType == 'likeByTags'){
            
                                    // check if post was not already liked
                                    if (await page.$(emptyHeartIcon) !== null){
                                        await page.click(emptyHeartIcon);
                                        console.log("Post liked");
                                        amountOfActionsDone++;
                                        var timestampLastLikeAction = Math.round((new Date()).getTime() / 1000);
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
                    
                    // check if user already exists inside dbActions - thus used the app before
                    if (!userFoundInDbStopAction){
                        var dbStopAction = new Datastore({ filename: 'dbStopActions.db' , autoload: true });
                        await dbStopAction.find({ username: username }).sort({ created_at: -1 }).exec(function 
                        (err, dbStopActionData) {
            
                            //dbUsers.find({ username: username }, (err, dbUsersData) => {
                            if (err){
                                //response.end();
                                console.log(err);
                                return
                            }
                            if (dbStopActionData[0] == null){
                                console.log('Stop Action No User found: '+ dbStopActionData[0]);
                                userFoundInDbStopAction = false;
                            } else {
                                console.log('Stop Action Found User: ', dbStopActionData[0]);
                                var lastEntryInDbStopActions = dbStopActionData[0];
                                var timestampOfLastEntry = lastEntryInDbStopActions.created_at;
                                console.log('timestamp stopAction: '+ timestampOfLastEntry);
                                userFoundInDbStopAction = true;
                            }
                        });
                    }
                }
            
                // check if loop ended because of stop action of user
                if (userFoundInDbStopAction) {
                    console.log('Actions stopped');
                    var feedback = 'actionStopped';
                    var timestampActionsEnded = Math.round((new Date()).getTime() / 1000);
                    await browser.close();
                    await response.json({
                        feedback,
                        dbObjectUsers,
                        actions_ended: timestampActionsEnded,
                        amountOfActionsDone,
                        status: "actions stopped by user"
                    });
                } 
                
                // response with success when loop is done and user didn't stop the script
                else {
                    var feedback = 'Looping done'
                    var timestampActionsEnded = Math.round((new Date()).getTime() / 1000);
                    await browser.close();
                    await response.json({
                        feedback,
                        actions_ended: timestampActionsEnded,
                        dbObjectUsers,
                        amountOfActionsDone,
                        status: "Actions finished successful"
                    });
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
        } catch (e){
            console.log('Error Logged: '+ e);
            const error = e;
            var timestampErrorWasLogged = Math.round((new Date()).getTime() / 1000);
            dbErrorObject = {
                created_at: timestampErrorWasLogged,
                errorLog: error,
                username: request.body.username,
                searchTerms: request.body.arrayOfSearchTerms,
            }
            dbErrors.insert(dbErrorObject);
            await response.json({
                status: "Error was logged - Please try again later"
            });
        }
    }
    main();
});

