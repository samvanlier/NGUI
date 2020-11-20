/**
 * Cleanup a user pose based on the feedback that has been generated
 * @param {*} userPose 
 * @param {*} feedback 
 * @returns {*} a user pose
 */
function resetPose(userPose, feedback){
    if(feedback.horizontalHips != null && feedback.horizontalHips !== ""){
        userPose.horizontalHips = 0
    }

    if(feedback.horizontalShoulders != null && feedback.horizontalShoulders !== ""){
        userPose.horizontalShoulders = 0
    }

    if(feedback.neutralPositionLeft != null && feedback.neutralPositionLeft !== ""){
        userPose.neutralPositionLeft = 0
    }

    if(feedback.neutralPositionRight != null && feedback.neutralPositionRight !== ""){
        userPose.neutralPositionRight = 0
    }

    if(feedback.kneeAnkleAlignmentLeft != null && feedback.kneeAnkleAlignmentLeft !== ""){
        userPose.kneeAnkleAlignmentLeft = 0
    }

    if(feedback.kneeAnkleAlignmentRight != null && feedback.kneeAnkleAlignmentRight !== ""){
        userPose.kneeAnkleAlignmentRight = 0
    }

    if(feedback.hipHeightToLow != null && feedback.hipHeightToLow !== ""){
        userPose.hipHeightToLow = 0
    }
    
    return userPose;
}

/**
 * Checks if feedback has to be given
 * @param {Number} pose The number of violations
 * @param {Number} nrOfOccurances 
 * @param {String} text The text message that has to be given
 * @returns text if the feedback has to be given; otherwise it returns null
 */
function feedback(pose, nrOfOccurances, text){
    if(pose === nrOfOccurances){
        return text;
    }
    
    return null;
}

const hh = "Hips are not parallel to the floor"; // horizontal hips
const hs = "Shoulders are not parallel to the floor"; // horizontal shoulders
const npl = "Left ankle not in the correct position"; // neutral position left
const npr = "Right ankle not in the correct position"; // neutral position right
const al = "Left knee ankle alignment is wrong"; // knee-ankle alignment left
const ar = "Right knee ankle alignment is wrong"; // knee-ankle alignment right
const squat = "You squat is too low"; // hip Height To Low

/**
 * Create the feedback for a user
 * @param {Object} userPose A userPose
 * @param {Number} nrOfOccurrences 
 * @returns {Object} A feedback bag containing the updated userPose and an feedback-object which contains the feedback in the same structure as a userPose object
 */
export function createFeedback(userPose, nrOfOccurrences){
    let result = {
        horizontalHips: feedback(userPose.horizontalHips, nrOfOccurrences, hh),
        horizontalShoulders: feedback(userPose.horizontalShoulders, nrOfOccurrences, hs),
        neutralPositionLeft: feedback(userPose.neutralPositionLeft, nrOfOccurrences, npl),
        neutralPositionRight: feedback(userPose .neutralPositionRight, nrOfOccurrences, npr),
        kneeAnkleAlignmentLeft: feedback(userPose.kneeAnkleAlignmentLeft, nrOfOccurrences, al),
        kneeAnkleAlignmentRight: feedback(userPose.kneeAnkleAlignmentRight, nrOfOccurrences, ar),
        hipHeightToLow: feedback(userPose.hipHeightToLow, nrOfOccurrences, squat) //todo rename?
    };

    let pose = resetPose(userPose, result);

    return {
        userPose: pose,
        result: result
    }
}