<template></template>

<script>
  import Speech from "./Speech";

  export default {
    name: "Feedback",
    /**
     * Create the feedback for a user
     * @param {Object} check is a list of all the checks done for the exercise
     * @param {Number} nrOfOccurrences
     * @param {Boolean} positiveCycle If true generate positive feedback
     * @returns {Object} A feedback bag containing the updated userPose and an feedback-object which contains the feedback in the same structure as a userPose object
     */
    createFeedback(check, nrOfOccurrences, positiveCycle) {
      // array of feedback strings (maximum maxResults elements)
      let results = [];
      // maximum number of results that are returned
      let maxResults = 2;
      // different positive feedback strings
      let positiveFeedback = ["You are doing good", "Keep it up!", "Now that is what I call proper form"];

      // restricts feedback to a maximum of 2, with priority on occurrences
      function helper(fba, i) {
        if (i !== results.length && results[i].occurrences < fba.occurrences) {
          results[i] = fba.text;
        } else if (i !== results.length && results[i].occurrences >= fba.occurrences) {
          i++;
          helper(fba, i);
        }
      }

      // loops over check to extract the feedbacks which have equal or more occurrences than the nrOfOccurrences
      for (let i = 0; i < check.length; i++) {
        if ((check[i].occurrences >= nrOfOccurrences) && (results.length < maxResults)) {
          results.push(check[i].text);
        } else if ((check[i].occurrences >= nrOfOccurrences)) {
          helper(check[i], 0);
        }
      }

      // put positive feedback in results
      if (positiveCycle && (results.length === 0)) {
        results.push(positiveFeedback[Math.floor(Math.random() * positiveFeedback.length)])
      }

      // reset check occurrences and text
      for (let i = 0; i < check.length; i++) {
        check[i].occurrences = 0;
        check[i].text = ""
      }

      return {
        check: check,
        results: results,
      }
    },
    /**
     * Check if there is any mistake
     * @param {*} check A feedback collection
     */
    checkFeedBack(check) {
      for (let i = 0; i < check.length; i++) {
        if (check[i].text !== null && check[i].text !== "") {
          return true;
        }
      }
    },
    /**
     * Gives the feedback to the user
     * @param {*} fb A feedback collection
     */
    giveFeedback(fb) {
      function toString() {
        if (fb.length > 0) {
          return fb.join("</br>");
        }
        return "";
      }

      let ta = document.getElementById('feedback');
      let current = toString();

      if (current != null && current !== "") {
        ta.innerHTML = current;

        // voice test
        Speech.speak(current);
      }
    }
  }
</script>

<style scoped>

</style>
