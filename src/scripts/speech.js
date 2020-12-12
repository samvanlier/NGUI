// source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API




/**
 * 
 * @param {String} msg The message that has to be spoken.
 * @param {String} lang The language of the message. Default 'en'.
 */
export function speak(msg, lang = 'en'){
    let utterance = new SpeechSynthesisUtterance();
    utterance.text = msg;
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}

// chrome support
const SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
const SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
const SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

// create grammar
const commands = ['start', 'stop'];
const grammar = '#JSGF V1.0; grammar commands; public <command> = ' + commands.join(' | ') + ' ;';

// add grammar to speech recognition
const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
const weight = 1; // a weight that can range from 0 to 1
speechRecognitionList.addFromString(grammar, weight);

recognition.grammars = speechRecognitionList; // add grammar
recognition.continuous = true; // Controls whether continuous results are captured (true), or just a single result each time recognition is started (false)
recognition.lang = "en-US"; // set the language that has to be recognized
recognition.interimResults = false; // set if intermediate results have to be returned (true) or only final results
recognition.maxAlternatives = 1; // the number of alternative results that have to be returned

/**
 * Start the recognition of speech
 * @param {function(Object)} onresult A callback function to handle a result
 * @param {function(Object)} onnomatch A callback function to handle an error
 */
export function startRecognition(onresult){
    
    recognition.onresult = onresult;

    /*
    recognition.onspeechend = function(){
       recognition.start;
    }*/

    recognition.onerror = function(error){

        //console.log(error);

    }

    recognition.onend = function() {
        if (!(app.started)){  //comment this to enable listening during exercise.
        recognition.start();
        } //comment this to enable listening during exercise.
    };

    recognition.start();
}

export function stopRecognition(){
    recognition.stop();
}