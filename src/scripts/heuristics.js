/**
 * An Enum for the keypoints of the body
 */
export const Keypoints = {
    nose: 0,
    leftEye: 1,
    rightEye: 2,
    leftEar: 3,
    rightEar: 4,
    leftShoulder: 5,
    rightShoulder: 6,
    leftElbow: 7,
    rightElbow: 8,
    leftWrist: 9,
    rightWrist: 10,
    leftHip: 11,
    rightHip: 12,
    leftKnee: 13,
    rightKnee: 14,
    leftAnkle: 15,
    rightAnkle: 16
};

/**
 * See if the hips are horizontal.
 * @param {*} leftHip The key-point that represents the left hip
 * @param {*} rightHip The key-point that represent the right hip
 * @param {Number} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function horizontalHips(leftHip, rightHip, mpc){
    const angle = Math.atan((rightHip.position.y - leftHip.position.y) / (rightHip.position.x - leftHip.position.x)) * 180 / Math.PI;
    const threshold = 5;

    if (leftHip.score > mpc && rightHip.score > mpc) {
        if (Math.abs(angle) > threshold) {
            return 1;
        }
    }

    return 0;
}

/**
 * See if the shoulders are horizontal.
 * @param {*} leftShoulder The key-point that represents the left shoulder
 * @param {*} rightShoulder The key-point that represents the right shoulder
 * @param {Number} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function horizontalShoulders(leftShoulder, rightShoulder, mpc){
    const angle = Math.atan((rightShoulder.position.y - leftShoulder.position.y) / (rightShoulder.position.x - leftShoulder.position.x)) * 180 / Math.PI;
    const threshold = 5;

    if (leftShoulder.score > mpc && rightShoulder.score > mpc){
        if (Math.abs(angle) > threshold){
            return 1;
        }
    }

    return 0;
}

/**
 * See if the left side of the body is in neutral position
 * @param {*} leftAnkle The key-point that represents the left ankle
 * @param {*} leftShoulder The key-point that represents the left shoulder
 * @param {Number} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function neutralPositionLeft(leftAnkle, leftShoulder, mpc){
    // leftShoulder and leftAnkle (vertical - angle of 95-85)
    const angle = Math.atan((leftAnkle.position.y - leftShoulder.position.y) / (leftAnkle.position.x - leftShoulder.position.x)) * 180 / Math.PI;

    if (leftAnkle.score > mpc && leftShoulder.score > mpc){
        if (Math.abs(angle) > 90 || Math.abs(angle) < 88){
            return 1;
        }
    }

    return 0;
}

/**
 * See if the right side of the body is in neutral position
 * @param {*} rightAnkle The key-point that represents the right ankle
 * @param {*} rightShoulder The key-point that represents the right shoulder
 * @param {Number} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function neutralPositionRight(rightAnkle, rightShoulder, mpc){
    // rightShoulder and rightFoot (vertical - angle of 95-85)
    const angle = Math.atan((rightShoulder.position.y - rightAnkle.position.y) / (rightShoulder.position.x - rightAnkle.position.x)) * 180 / Math.PI;

    if (rightShoulder.score > mpc && rightAnkle.score > mpc){
        if (angle < 0 && angle > -88){
            return 1;
        }
    }

    return 0;
}

/**
 * See if the left knee-ankle alignment is correct
 * @param {*} leftKnee The key-point that represents the left knee
 * @param {*} leftAnkle The key-point that represents the left ankle
 * @param {*} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function kneeAnkleAlignmentLeft(leftKnee, leftAnkle, mpc){
    // leftKnee and leftAnkle (vertical)
    const angle = Math.atan((leftAnkle.position.y - leftKnee.position.y) / (leftAnkle.position.x - leftKnee.position.x)) * 180 / Math.PI;

    if (leftAnkle.score > mpc && leftKnee.score > mpc){
        if (angle < 0 && angle > -85 || angle > 0 && angle < 85) {
            return 1;
        }
    }

    return 0;
}

/**
 * See if the right knee-ankle alignment is correct
 * @param {*} rightKnee The key-point that represents the right knee
 * @param {*} rightAnkle The key-point that represents the right ankle
 * @param {Number} mpc The minPartConfidence
 */
function kneeAnkleAlignmentRight(rightKnee, rightAnkle, mpc){
    // rightKnee and rightFoot (vertical)
    const angle = Math.atan((rightKnee.position.y - rightAnkle.position.y) / (rightKnee.position.x - rightAnkle.position.x)) * 180 / Math.PI;

    if (rightKnee.score > mpc && rightAnkle.score > mpc){
        if (angle < 0 && angle > -85 || angle > 0 && angle < 85){
            return 1;
        }
    }

    return 0;
}

/**
 * Check if the hips are to low compared to the knees
 * @param {*} leftKnee The key-point that represents the left knee
 * @param {*} rightKnee The key-point that represents the right knee
 * @param {*} leftHip The key-point that represents the left hip
 * @param {*} rightHip The key-point that represent the right hip
 * @param {*} mpc The minPartConfidence
 * @returns {Number} //todo explain 1 and 0
 */
function hipHeight(leftKnee, rightKnee, leftHip, rightHip, mpc){
    const hipX = (leftHip.position.x + rightHip.position.x) / 2;
    const hipY = (leftHip.position.y + rightHip.position.y) / 2;
    const kneeX = (leftKnee.position.x + rightKnee.position.x) / 2;
    const kneeY = (leftKnee.position.y + rightKnee.position.y) / 2;

    const distance = Math.sqrt(Math.pow(kneeX - hipX, 2) + Math.pow(kneeY - hipY, 2));

    if (leftKnee.score > mpc && leftKnee.score > mpc && leftHip.score > mpc && rightHip.score > mpc){
        if (distance < 20){
            return 1;
        }
    }

    return 0;
}

/**
 * Check the pose of the user
 * @param {*} keypoints An array of key-points of the user
 * @param {*} minPartConfidence 
 * @param {*} userPose The pose of the user
 * @returns a userPose with updated points
 */
export function checkHeuristics(keypoints, minPartConfidence, userPose){
    let leftHip = keypoints[Keypoints.leftHip];
    let rightHip = keypoints[Keypoints.rightHip];

    let leftShoulder = keypoints[Keypoints.leftShoulder];
    let rightShoulder = keypoints[Keypoints.rightShoulder];

    let leftAnkle = keypoints[Keypoints.leftAnkle];
    let rightAnkle = keypoints[Keypoints.rightAnkle];

    let leftKnee = keypoints[Keypoints.leftKnee];
    let rightKnee = keypoints[Keypoints.rightKnee];

    // check neutral pose
    // left side
    userPose.neutralPositionLeft += neutralPositionLeft(leftAnkle, leftShoulder, minPartConfidence);
    // right side
    userPose.neutralPositionRight += neutralPositionRight(rightAnkle, rightShoulder, minPartConfidence);

    // check horizontal pose
    // left and right hip horizontal
    userPose.horizontalHips += horizontalHips(leftHip, rightHip, minPartConfidence);
    // left and right shoulder horizontal
    userPose.horizontalShoulders += horizontalShoulders(leftShoulder, rightShoulder, minPartConfidence);

    // knee-ankle alignment
    // left side
    userPose.kneeAnkleAlignmentLeft += kneeAnkleAlignmentLeft(leftKnee, leftAnkle, minPartConfidence);
    // right side
    userPose.kneeAnkleAlignmentRight += kneeAnkleAlignmentRight(rightKnee, rightAnkle, minPartConfidence);

    // check if squat is to low
    userPose.hipHeightToLow += hipHeight(leftKnee, rightKnee, leftHip, rightHip, minPartConfidence);

    return userPose;
}
