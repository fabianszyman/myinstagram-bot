const playwright = require('playwright');
const express = require('express');
const { request, response } = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Action = require('./models/actions');
const Error = require('./models/errors');
const StopAction = require('./models/stopactions');


// Connect to MongoDB
//const mongoDBUser = process.env.MONGO_DB_USER;
//const monogoDBPassword = process.env.PASSWORD;
//const PORT = process.env.HEROKU_PORT;

//const MONGODB_URI = 'mongodb+srv://'+mongoDBUser+':'+monogoDBPassword+'@myinstagrambot.mo425.mongodb.net/InstaBot?retryWrites=true&w=majority'

// connect Mongoose to your DB


var port = 3000;

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => app.listen(port, () => console.log(`listening at ${port}`)))
    .catch((err) => console.log(err));


// get User from mongoos
app.get('/all-users', (req,res) => {
    User.find({username:'sneaker_mania_berlin'}).sort({createdAt: -1}).limit(1)
    .then((result) => {
        res.send(result)
    })
    .catch((err) => {
        console.log(err)
    })
})

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
var userNameInsidePostSelector = 'div.e1e1d > div > span > a';


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


app.post('/stop', (request, response) => {

    const userStopAction = request.body;
    const usernameFromStopAction = userStopAction.username;
    const sessionIDFromStopAction = userStopAction.session_id;
    var timestampActionsStopped = Math.round((new Date()).getTime() / 1000);;

    // mongoos and mongo sandbox routes 
    const stopAction = new StopAction({
        username: usernameFromStopAction,
        session_id: sessionIDFromStopAction
    });
    stopAction.save()
    .then((result) => {
        console.log('DB Stop Action Entry dbStopActions done');
    })
    .catch((err) => {
        console.log(err)
    })

    response.json({
        status: "actions stopped by user - This action can take a couple of seconds"
    });

});



app.post('/api', (request, response) => {
    const userData = request.body;
    const username = userData.username;
    const password = userData.password;
    const session_id = userData.session_id;
    const arrayOfSearchTerms = userData.arrayOfSearchTerms;

    // mongoos and mongo sandbox routes 
    const user = new User({
            username: username,
            password: password,
            session_id: session_id
    });
    user.save()
    .then((result) => {
        console.log('DB Entry dbUsers done');
    })
    .catch((err) => {
        console.log(err)
    })


    async function main() {
        try{
            const browser = await playwright.chromium.launch({
                headless: false // setting this to true will not run the UI
            }); 
            const page = await browser.newPage();

            // --->> await page.waitForTimeout(500000); // ----> just testig purpose remove before you push

            
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
                                            
                                            /* --> insert DBObject to neDB 
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
                                            */
                            
                                        }
                                        
                                        // check if follow action CTA appears on screen && check if amountOfFollowersUserHas is smaller than the max Number he should have more 
                                        else if (await page.$(followCTA) !== null && amountOfFollowersUserHas < maxAmountOfFollowersACertainUserShouldHave){
                                            await page.click(followCTA);
                                            console.log('User '+ userNameThatCertainUserHas + ' was followed');
                                            amountOfActionsDone++;
                                            var timestampLastLikeAction = Math.round((new Date()).getTime() / 1000);

                                            // mongoos and mongo sandbox routes 
                                            const action = new Action({
                                                username: username,
                                                searchTerms: arrayOfSearchTerms,
                                                session_id: session_id,
                                                seachTermUsed: searchTerm,
                                                amountOfActionsDone: amountOfActionsDone,
                                                actionType: actionType,
                                                userData: {
                                                    username: userNameThatCertainUserHas,
                                                    url: 'https://www.instagram.com/'+userNameThatCertainUserHas,
                                                    amount_of_posts: amountOfPostsUserHas,
                                                    amount_of_followers: amountOfFollowersUserHas,
                                                    amount_of_people_user_follows: amountOfPeopleUserFollows
                                                }
                                            });
                                            action.save()
                                            .then((result) => {
                                                console.log('DB-Action Entry dbActions done');
                                            })
                                            .catch((err) => {
                                                console.log(err)
                                            })
                                        }
                                    }
                                }
                            
                                // start Action click like Button 
                                if (actionType == 'likeByTags'){

                                if (await page.$(userNameInsidePostSelector) !== null){
                                    var amountOfFollowersUserHasString = await page.$eval(userNameInsidePostSelector, a => a.textContent);
                                    console.log('UserName from Instgram Post '+ amountOfFollowersUserHas);
                                }
                                var postURL = await page.url();
                                console.log('Current URL is :'+ postURL);
                                    
                                    // check if post was not already liked
                                    if (await page.$(emptyHeartIcon) !== null){
                                        await page.click(emptyHeartIcon);
                                        console.log("Post liked");
                                        amountOfActionsDone++;

                                        // mongoos and mongo sandbox routes 
                                        const action = new Action({
                                            username: username,
                                            searchTerms: arrayOfSearchTerms,
                                            session_id: session_id,
                                            seachTermUsed: searchTerm,
                                            amountOfActionsDone: amountOfActionsDone,
                                            actionType: actionType,
                                            userData: {
                                                username: amountOfFollowersUserHasString,
                                                url: 'https://www.instagram.com/'+amountOfFollowersUserHasString,
                                                urlOfCertainPost: postURL
                                            }
                                        });
                                        action.save()
                                        .then((result) => {
                                            console.log('DB-Action Entry dbActions done');
                                        })
                                        .catch((err) => {
                                            console.log(err)
                                        })

                                    } else {
                                        console.log("Post was already liked");
                                    }
                                }
                            }
                        }
                    }
                    
                    // check if user already exists inside dbActions - thus used the app before
                    if (!userFoundInDbStopAction){
                        // get User from mongoos
                        
                        StopAction.find({username:username}).sort({createdAt: -1}).limit(1)
                        .then((result) => {

                            // convert BSON object from MongoDB to JSON Object
                            const LatestEntryInsideStopActionCollectionWithCurrentUserName = JSON.stringify(result[0]);
                            const LatestEntryInsideStopActionCollectionWithCurrentUserNameJSON  = JSON.parse( LatestEntryInsideStopActionCollectionWithCurrentUserName );
            
                            var sessionIDFromLastEntry = LatestEntryInsideStopActionCollectionWithCurrentUserNameJSON.session_id;
                            console.log('THIS IS MY SESSION ID '+ sessionIDFromLastEntry)
            
                            if (sessionIDFromLastEntry == session_id) {
                                console.log('Stop Action Found User: ', LatestEntryInsideStopActionCollectionWithCurrentUserNameJSON.username);
                                userFoundInDbStopAction = true;
                            } else {
                                console.log('Old Session ID: '+ sessionIDFromLastEntry+ ' is not equal with new session ID: '+ session_id);
                                console.log('User was found inside StopDB but session is an old one');
                            }
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                        
/* ----->

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

                                // check if user stopped action inside same session 

                                var lastEntryInDbStopActions = dbStopActionData[0];
                                var timestampOfLastEntry = lastEntryInDbStopActions.created_at;
                                var sessionIDFromLastEntry = lastEntryInDbStopActions.session_id;

                                if (sessionIDFromLastEntry == session_id) {
                                    console.log('Stop Action Found User: ', dbStopActionData[0]);
                                    console.log('timestamp stopAction: '+ timestampOfLastEntry);
                                    userFoundInDbStopAction = true;
                                } else {
                                    console.log('User was found inside StopDB but session is an old one');
                                }
                            }
                        });
--->  */
                    }
                }
            
                // check if loop ended because of stop action of user
                if (userFoundInDbStopAction) {
                    console.log('Actions stopped');
                    var feedback = 'actionStopped';
                    var timestampActionsEnded = Math.round((new Date()).getTime() / 1000);
                    userFoundInDbStopAction = false;
                    await browser.close();
                    await response.json({
                        feedback,
                        actions_ended: timestampActionsEnded,
                        amountOfActionsDone,
                        status: "actions stopped by user - This action can take a couple of seconds "
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
        } catch (er){
            console.log('Error Logged: '+ er);
            var timestampErrorWasLogged = Math.round((new Date()).getTime() / 1000);

            // MongoDB log Error in DB Collection Errors
            const error = new Error({
                username: username,
                session_id: session_id,
                errorInfo: er,
            });
            error.save()
            .then((result) => {
                console.log('DB-Action Entry dbErrors done');
            })
            .catch((err) => {
                console.log(err)
            })

            await response.json({
                status: "Error was logged - Please try again later"
            });
        }
    }
    main();
});

