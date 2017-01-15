const RapidAPI = require('rapidapi-connect');
const rapid = new RapidAPI('AlexaTranslator', 'eb4ad4e0-f9ce-426d-8c7c-87d07f6813b1');//Insert your Rapid API Key
var chosen_language = '';
var chosen_word = '';
var translated_word = '';
const N_REPEAT = 3;
var repeat_count = 0;
var temp_language = '';
var temp_word = '';
const cardTitle = 'Bad Lingo -  The definitive app for learning languages';
const GoogleAPIKey = 'AIzaSyD9O-9z-uOLv9REaYsKbeUg30FrtIDyCM0';
const langCodes = {
    "German" : "de",
    "Dutch" : "nl",
    "English" : "en",
    "French" : "fr",
    "Italian" : "it",
    "Polish" : "pl",
    "Spanish" : "es"
};

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession:shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const speechOutput = 'Welcome to Bad Lingo, the Best Language Teacher App Ever. You can now delete your duolingo app. Let us begin your rigorous training. What language do you want to learn? Begin by saying I want to learn followed by a language.';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Say I want to learn, followed by a language.';
    const shouldEndSession = false;
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelpResponse(intent, session, callback) {
    // declare session attributes
    var sessionAttributes = {};
    // here is the help provided to the user
    var speechOutput = "Tell Bad Lingo what language you want to learn by saying I want to learn followed by a language.";

    // if user does not respond, this will be played after a few seconds
    var repromptText = "I repeat, I want to learn this language.";

    // make sure that the session is not ended
    var shouldEndSession = false;

    // build the speech that user will hear
    callback({},
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getExitResponse(intent, session, callback) {
    // declare session attributes
    var sessionAttributes = {};
    // define title for the card.
    var cardTitle = "Bad Lingo Exit";
    // here is the help provided to the user
    var speechOutput = "A journey of a thousand miles begins with a single step. You have taken half a step, well done!";

    // make sure that the session is not ended
    var shouldEndSession = true;

    // build the speech that user will hear
    callback({},
        buildSpeechletResponse(cardTitle, speechOutput,null, shouldEndSession));
}

/**
 * Intent handlers
 */

function setLanguage(intent, session, callback) {
    var said = intent.slots.Language.value;
    if (langCodes[said] === undefined) {
        callback({},
            buildSpeechletResponse(cardTitle, 'That language is not available. Bad Lingo is only available in English, German, French, Italian, Dutch, Spanish, and Polish. Please try again. State I want to learn, followed by your desired language.',null, false));
    } else if (chosen_language === '' && temp_language === '') {
        chosen_language = said;
        chosen_word = '';
        callback({},
            buildSpeechletResponse(cardTitle, 'So you have chosen ' + chosen_language + '. What word would you like to learn? Begin with the word is',null, false));
    } else if (chosen_language === said) {
        if (temp_language !== '') {
            temp_language = '';
            if (chosen_word === '') {
                callback({},
                buildSpeechletResponse(cardTitle, "I am glad to hear that. " + chosen_language + ' is fun. Pick a word with the phrase, the word is',null, false));
            } else {
                callback({},
                buildSpeechletResponse(cardTitle, "I am glad to hear that. " + chosen_language + ' is fun. Let us continue our practice. Say. ' + chosen_word,null, false));
            }
        } else if (chosen_word === '') {
            callback({},
                buildSpeechletResponse(cardTitle, 'Kid, you are practising ' + chosen_language + '. Pick a word with the phrase, the word is',null, false));
        } else {
            callback({},
                buildSpeechletResponse(cardTitle, 'Hey pay attention! This is ' + chosen_language + '. Now, try saying ' + chosen_word ,null, false));
        }
    } else if (chosen_language !== '' && temp_language === '') {
        temp_language = intent.slots.Language.value;
        callback({}, buildSpeechletResponse(cardTitle, 'Were you attempting to change your language? I can understand, ' + chosen_language + 'is hard. ? Well, say I want to learn ' + temp_language + ' to confirm. Otherwise, say I want to learn ' + chosen_language, null, false));
    } else if (chosen_language !== '' && temp_language !== '') {
        if (temp_language === said) {
            chosen_language = temp_language;
            temp_language = '';
            chosen_word = '';
            callback({}, 
                buildSpeechletResponse(cardTitle, 'You have changed your language to ' + chosen_language + '. What word would you like to learn? Say, the word is, followed by your word.',null, false));
        } else {
            temp_language = intent.slots.Language.value;
            callback({}, buildSpeechletResponse(cardTitle, 'Were you attempting to change your language? I can understand, ' + chosen_language + 'is hard. ' + temp_language + '? Well, say I want to learn ' + temp_language + ' to confirm. Otherwise, say I want to learn ' + chosen_language, null, false));
        }
    }
}

function setWord(intent, session, callback) {
    var said = intent.slots.Source.value;
    if (chosen_language === '') {
        callback({}, 
            buildSpeechletResponse(cardTitle, 'Did you not listen to my instruction? It is simple. You need to tell me which language you want to learn so that I can teach you. Understand? I highly recommend English for beginners. Like this, I want to learn English.',null, false));
    } else if (chosen_word === '') {
        temp_word = '';
        chosen_word = said;
        repeat_count = 0;
        rapid.call('GoogleTranslate', 'translateAutomatic', {
            string : chosen_word,
            apiKey: GoogleAPIKey,
            targetLanguage: langCodes[chosen_language]
        })
            .on('error', (payload) => {
                callback({},
                    buildSpeechletResponse(cardTitle, "Sorry but Google Translate is not working at the moment", null, false));
            })
            .on ('success', (payload) => {
                translated_word = payload;
                callback({},
                    buildSpeechletResponse(cardTitle, `${chosen_word} in ${chosen_language} is ${payload}. Now, repeat after me, ${translated_word}`,null, false)); 
            });
    } else if (chosen_word === said) {
        temp_word = '';
        repeat_count++;
        callback({},
            buildSpeechletResponse(cardTitle, "Yes, we are practicing the word for " + chosen_word + "Say it.", null, false));
    } else {
        if (chosen_word !== said && repeat_count >= N_REPEAT + 1) {
            temp_word = '';
            chosen_word = said;
            repeat_count = 0;
            rapid.call('GoogleTranslate', 'translateAutomatic', {
                string : chosen_word,
                apiKey: GoogleAPIKey,
                targetLanguage: langCodes[chosen_language]
            })
                .on('error', (payload) => {
                    callback({},
                        buildSpeechletResponse(cardTitle, "Sorry but Google Translate is not working at the moment", null, false));
                })
                .on ('success', (payload) => {
                    translated_word = payload;
                    callback({},
                        buildSpeechletResponse(cardTitle, `Great choice! Did you know that learning a new language helps with with memory retention? No? Well, let's move on. ${chosen_word} is ${translated_word}. Try it. ${translated_word}`,null, false)); 
                });
        } else if (temp_word === '' || temp_word !== said) {
            temp_word = said;
            callback({},
                buildSpeechletResponse(cardTitle, "Are you attempting to change the word? I must say, you haven't spent alot of time on it. But if you really want to, just say the word is " + temp_word + ", else, say the word is " + chosen_word, null, false));
        } else if (temp_word === said) {
            chosen_word = said;
            temp_word = '';
            repeat_count = 0;
            rapid.call('GoogleTranslate', 'translateAutomatic', {
                string : chosen_word,
                apiKey: GoogleAPIKey,
                targetLanguage: langCodes[chosen_language]
            })
                .on('error', (payload) => {
                    callback({},
                        buildSpeechletResponse(cardTitle, "Sorry but Google Translate is not working at the moment", null, false));
                })
                .on ('success', (payload) => {
                    translated_word = payload;
                    callback({},
                        buildSpeechletResponse(cardTitle, `You are now going to say ${translated_word}, the word for ${chosen_word}. Try it out. ${translated_word}`,null, false)); 
                });
        }
    }
}

function practice(intent, session, callback) {
    const GoogleAPIKey = 'AIzaSyD9O-9z-uOLv9REaYsKbeUg30FrtIDyCM0';
    const source = intent.slots.Source.value;
    var choice;
    var repromptRepeat = translated_word;
    var repromptWord = "Tell me which word do you want to practice with next.";
    if (repeat_count < N_REPEAT) {
        choice = Math.floor(Math.random() * 10);
        switch (choice) {
            case 0:
                callback({}, buildSpeechletResponse(cardTitle, 'Not bad. Again, ' + translated_word, repromptRepeat, false));
                break;
            case 1:
                callback({}, buildSpeechletResponse(cardTitle, 'Could be worse. Try again, ' + translated_word, repromptRepeat, false));
                break;
            case 2:
                callback({}, buildSpeechletResponse(cardTitle, 'My grandma can do better than you. Go on, ' + translated_word, repromptRepeat, false));
                break;
            case 3:
                callback({}, buildSpeechletResponse(cardTitle, "Good try. Now, repeat it like you mean it, " + translated_word, repromptRepeat, false));
                break;
            case 4:
                callback({}, buildSpeechletResponse(cardTitle, "I know you can do better than this. Say it again, " + translated_word, repromptRepeat, false));
                break;
            case 5:
                callback({}, buildSpeechletResponse(cardTitle, "Did you just swear? Try saying it with less anger, like this, " + translated_word, repromptRepeat, false));
                break;
            case 6:
                callback({}, buildSpeechletResponse(cardTitle, "I can't hear you! Louder! " + translated_word, repromptRepeat, false));
                break;
            case 7:
                callback({}, buildSpeechletResponse(cardTitle, "Awesome job. Let's hear it one more time. " + translated_word, repromptRepeat, false));
                break;
            case 8:
                callback({}, buildSpeechletResponse(cardTitle, "That was wonderful. You are a natural, but even naturals need some practice now and then. Go on little one, " + translated_word, repromptRepeat, false));
                break;
            case 9:
                callback({}, buildSpeechletResponse(cardTitle, "You have the voice of an angel. Oh, how rich it is! Say " + translated_word + "for me!", repromptRepeat, false));
                break;
        }
    } else {
        choice = Math.floor(Math.random() * 7);
        switch (choice) {
            case 0:
                callback({}, buildSpeechletResponse(cardTitle, "That's enough. You don't sound any better. Try another word. Start by saying, the word is", repromptWord, false));
                break;
            case 1:
                callback({}, buildSpeechletResponse(cardTitle, "I said you suck. Choose another word. Start with, the word is followed by your new word", repromptWord, false));
                break;
            case 2:
                callback({}, buildSpeechletResponse(cardTitle, "This is too hard for you. Choose an easier word. Begin with, the word is", repromptWord, false));
                break;
            case 3:
                callback({}, buildSpeechletResponse(cardTitle, "For your sake, I think you should choose another word. How about the word car? Say the word is car to try that", repromptWord, false));
                break;
            case 4:
                callback({}, buildSpeechletResponse(cardTitle, "Say another word or I'll blow your brains out. Now, now, just kidding. But really, give me another word. I don't have all day. Begin with the word is.", repromptWord, false));
                break;
            case 5:
                callback({}, buildSpeechletResponse(cardTitle, "Listen up bud. I've got something to say. I don't think this is working out that well. Maybe you should try another word. Start with the word is.", repromptWord, false));
                break;
            case 6:
                callback({}, buildSpeechletResponse(cardTitle, "I think you have gotten the hang of it. Shall we practice a new word now? To do that, say the word is followed by a new word.", repromptWord, false));
                break;
        }
    }
    repeat_count++;
}


// --------------- Events -----------------------


function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
    chosen_word = '';
    chosen_language = '';

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'LanguageIntent') {
        setLanguage(intent, session, callback);
    } else if (intentName === "WordIntent") {
        if (repeat_count === 0 || repeat_count >= N_REPEAT) {
            setWord(intent, session, callback);
        } else {
            practice(intent, session, callback);
        }
    } else if ("Practice" === intentName) {
        practice(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getHelpResponse(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        getExitResponse(intent, session, callback);
    }

    else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);

}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context,callback) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        // if it is a new session, do initialization
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        // detemine the type of request and call apporpriate function
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null,buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};
