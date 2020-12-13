import {speak} from "./speech";

/**
 * Create the feedback for a user
 * @param {Object} check is a list of all the checks done for the exercise
 * @param {Number} nrOfOccurrences
 * @returns {Object} A feedback bag containing the updated userPose and an feedback-object which contains the feedback in the same structure as a userPose object
 */
export function createFeedback(check, nrOfOccurrences, positiveCycle){
    var results = [];
    var maxRes = 2;
    var positiveFeedback = ["You are doing good", "Keep it up!", "Now that is what I call proper form"];

    function helper(fba, i){
      if (i === results.length){
        return
      }
      else if (results[i].occurances < fba.occurances){
        results[i] = fba;
        return
      }
      else{
        i++;
        helper(fba, i);
      }
    }

    //for loop over error om te zien of we een
    for (var i = 0; i< check.length ; i++){

      if ((check[i].occurances >= nrOfOccurrences) && (results.length < maxRes)){
        results.push(check[i]);
      } else if ((check[i].occurances >= nrOfOccurrences)){
        helper(check[i], 0);
      }
    }


    for (var i = 0; i < results.length ; i++){
      results[i] = results[i].text
    }
    if (positiveCycle && (results.length === 0)){
      results.push(positiveFeedback[Math.floor(Math.random() * positiveFeedback.length)])
    }

    for (var i = 0; i< check.length ; i++){
      check[i].occurances = 0
      check[i].text = ""
    }

    return {
        check: check,
        results: results,
    }
}

/**
 * Gives the feedback to the user
 * @param {*} check A feedback collection
 */
export function checkFeedBack(check){
  for (var i = 0; i< check.length ; i++){
    if (check[i].text !== null && check[i].text !== ""){
      return true;
    }
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
