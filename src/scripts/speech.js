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