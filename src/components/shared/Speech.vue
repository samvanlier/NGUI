<template>
</template>

<script>
  // chrome support
  import Trainer from "../Trainer";

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
  recognition.continuous = false; // Controls whether continuous results are captured (true), or just a single result each time recognition is started (false)
  recognition.lang = "en-US"; // set the language that has to be recognized
  recognition.interimResults = false; // set if intermediate results have to be returned (true) or only final results
  recognition.maxAlternatives = 1; // the number of alternative results that have to be returned

  export default {
    name: "Speech",
    components: {Trainer},
    speak(msg, lang = 'en') {
      let utterance = new SpeechSynthesisUtterance();
      utterance.text = msg;
      utterance.lang = lang;
      speechSynthesis.speak(utterance);
    },
    startRecognition(onresult) {
      // recognized speech
      recognition.onresult = onresult;

      // error
      recognition.onerror = function (error) {
        console.error(error)
      };

      recognition.onaudiostart = function () {
        // console.log("on audio start")

      };

      recognition.onsoundstart = function () {
        // console.log("on sound start")
      };

      recognition.onspeechstart = function () {
        //console.log("on speech start")
        Trainer.listening(true)
      };

      recognition.onnomatch = function () {
        // console.log("on no match")
      };

      recognition.onspeechend = function () {
        // console.log("on speech end")
        Trainer.listening(false)
      };

      recognition.onsoundend = function () {
        // console.log("on sound end")
      };

      recognition.onaudioend = function () {
        // console.log("on audio end")
      };

      Trainer.onEndFunction(recognition);

      recognition.start();
    },
    stopRecognition() {
      Trainer.stopFunction(recognition)
    }
  }
</script>

<style scoped>

</style>
