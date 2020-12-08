import {speak} from "./speech";

/**
 * Create the feedback for a user
 * @param {Object} check is a list of all the checks done for the exercise
 * @param {Number} nrOfOccurrences
 * @returns {Object} A feedback bag containing the updated userPose and an feedback-object which contains the feedback in the same structure as a userPose object
 */
export function createFeedback(check, nrOfOccurrences){
    var results = []
    var feedback = false

    //console.log("createFeedback: "+JSON.stringify(check))

    //for loop over error om te zien of we een
    for (var i = 0; i< check.length ; i++){
      if (check[i].occurances === nrOfOccurrences){
        results.push(check[i].text)
        feedback = true
        check[i].occurances = 0
        check[i].text = ""
      } else if (check[i].text !== null){
        feedback = true
      }
    }

    return {
        check: check,
        results: results,
        hasFeedback: feedback
    }
}

/**
 * Gives the feedback to the user
 * @param {*} fb A feedback collection
 */
export function giveFeedback(fb) {
  function toString() {
    if (fb.length > 0) {
      return fb.join("\n");
    }
    return "";
  }

  let ta = document.getElementById('feedback');
  let current = toString();

  if (current != null && current !== "") {
    ta.textContent = current;

    // voice test
    speak(current);
  }
}
