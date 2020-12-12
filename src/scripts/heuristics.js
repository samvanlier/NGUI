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

//===============================================HELPERS==============================================================
// calculated distance between 2 points
function distanceBetween2Points(point1, point2) { //length of line
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

//wrapper function for text and affected keypooints
function feedbackWrapper(text, keypoints) {
  return {text: text, keypoints: keypoints}
}

//angle between 3 points, calculate angle of the pivot point
function angleBetween3Points(point1, pivot, point2) {
  const b = distanceBetween2Points(point1, pivot)
  const a = distanceBetween2Points(pivot, point2)
  const c = distanceBetween2Points(point1, point2)

  const pivotAngleInRadians = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b))
  const pivotAngleInDegrees = pivotAngleInRadians * 180 / Math.PI

  return pivotAngleInDegrees
}

//checks wheter the keypoints are useable (not null and score > mpc)
function useableKeypoints(kps, mpc) {
  for (let i = 0; i < kps.length; i++) {
    if (kps[i] === null || kps[i].score < mpc) {
      return false
    }
  }
  return true
}

//===============================================BUILDING BLOCKS=====================================================

/*
* General explenation of angles:
* Angles that are given with the functions are in degrees
* North is 90° ( we don't use South because we can calculate all South with North)
* East & West are 0°
* North-East is negative (-89 till 0)
* North-West is positive (89 till 0)
* */

/**
 * Checks if distance between 2 lines, calculated from 4 points,
 * line1: point1 and point2
 * line2: point3 and point4
 * are higher then given distance parameter
 * @param kps keypoints
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function distanceBetween2Lines(kps, point1, point2, point3, point4, distance, feedback, mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]
  const p3 = kps[point3]
  const p4 = kps[point4]

  if (useableKeypoints([p1, p2, p3, p4], mpc)) {
    const aX = (p1.x + p2.x) / 2
    const aY = (p1.y + p2.y) / 2
    const bX = (p3.x + p4.x) / 2
    const bY = (p3.y + p4.y) / 2

    const d = Math.sqrt(Math.pow(bX - aX, 2) + Math.pow(bY - aY, 2));

    if (d < distance) {
      return feedbackWrapper(feedback, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
        id: point3,
        part: p3.part
      }, {id: point4, part: p4.part}]);
    }
  }

  return feedbackWrapper("", [])
}

/**
 * Check if the 2 given keypoints are horizontal.
 * @param kps keypoints
 * @param threshold gives us a margin in degrees, to combat the lack of reliability
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function horizontal(kps, point1, point2, threshold, feedback, mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]

  if (useableKeypoints([p1, p2], mpc)) {
    const angle = Math.atan((p1.position.y - p2.position.y) / (p2.position.x - p1.position.x)) * 180 / Math.PI;

    if (Math.abs(angle) > threshold) {
      return feedbackWrapper(feedback, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    }
  }
  return feedbackWrapper("", [])
}

/**
 * Check if 2 given keypoints are vertical.
 * @param kps keypoints
 * @param threshold gives us a margin in degrees, to combat the lack of reliability
 * @param feedback1 given feedback text when angle is to much to the right
 * @param feedback2 given feedback text when angle is to much to the left
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function vertical(kps, point1, point2, threshold, feedback1, feedback2, mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]

  if (useableKeypoints([p1, p2], mpc)) {
    const angle = Math.atan((p2.position.y - p1.position.y) / (p2.position.x - p1.position.x)) * 180 / Math.PI;

    if (angle < 0 && angle > -90 + threshold) {
      return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    } else if (angle > 0 && angle < 90 - threshold) {
      //too much to the left (need to move right)
      return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    }
  }
  return feedbackWrapper("", [])
}

/**
 * Check if 2 given keypoints are vertical between angle1 and angle2.
 * @param kps keypoints
 * @param angle1 angle2 these angles describe the allowed range
 * @param feedback1 given feedback text when angle is to much to the right
 * @param feedback2 given feedback text when angle is to much to the left
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function verticalRange(kps, point1, point2, angle1, angle2, feedback1, feedback2, mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]

  if (useableKeypoints([p1, p2], mpc)) {
    const a = Math.atan((p1.position.y - p2.position.y) / (p1.position.x - p2.position.x)) * 180 / Math.PI;

    // we hebben 4 mogelijkheden! (N, E, S, W)
    let a1 = angle1
    let a2 = angle2

    if (p1.position.y < p2.position.y) {
      if (a1 < 0 && a2 > 0) { // - to +
        if (a < 0 && a > a1) {
          return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        } else if (a > 0 && a < a2) {
          return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }
      } else if (a1 < 0 && a2 < 0) { // - to -
        if (a > a1) {
          return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        } else if (a < a2) {
          return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }
      } else if (a1 > 0 && a2 > 0) { // + to +
        if (a < a1) {
          return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        } else if (a > a2) {
          return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }
      }
    } else {
      return feedbackWrapper("bad orientation", [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    }


  }
  return feedbackWrapper("", [])
}

/**
 * Checks if angle formed between 2 lines, defined from 3 points is equal to given angle +- threshold
 * @param kps keypoints
 * @param point1, pivot, point2 form a triangle. We calculate the angle of the pivot
 * @param threshold gives us a margin in degrees, to combat the lack of reliability
 * @param feedback1 given feedback text when angle is to much to the right
 * @param feedback2 given feedback text when angle is to much to the left
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function angle(kps, point1, pivot, point2, angle, threshold = 1,
               feedback1 = "Angle is too small.",
               feedback2 = "Angle is too big.", mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]
  const p3 = kps[pivot]

  if (useableKeypoints([p1, p2, p3], mpc)) {
    const a = angleBetween3Points(p1, p3, p2)
    if (a < angle - threshold) { //undershoot
      return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
        id: pivot,
        part: p3.part
      }]);
    } else if (a > angle + threshold) { //overshoot
      return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
        id: pivot,
        part: p3.part
      }]);
    }
  }
  return feedbackWrapper("", [])
}


/**
 * Checks if angle formed between 2 lines, defined from 3 points, needs to be between angle1 and angle2
 * @param kps keypoints
 * @param point1, pivot, point2 form a triangle. We calculate the angle of the pivot
 * @param angle1 angle2 these angles describe the allowed range
 * @param feedback1 given feedback text when angle is to much to the right
 * @param feedback2 given feedback text when angle is to much to the left
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function angleRange(kps, point1, pivot, point2, angle1, angle2,
                    feedback1 = "Angle is too small.",
                    feedback2 = "Angle is too big.", mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]
  const p3 = kps[pivot]

  if (useableKeypoints([p1, p2, p3], mpc)) {
    const a = angleBetween3Points(p1, p3, p2)
    if (a < angle1) { //undershoot
      return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
        id: pivot,
        part: p3.part
      }]);
    } else if (a > angle2) { //overshoot
      return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
        id: pivot,
        part: p3.part
      }]);
    }
  }
  return feedbackWrapper("", [])
}

//=============================================== MAIN ==============================================================

/**
 * Checks if person is fully in screen
 * @param kps keypoints
 * @param feedback given feedback text when person is not fully in screen
 * @param mpc minimum part confidence
 * @return {Object} with feedback text and the keypoints that it applies to
 */
function inScreen(kps, feedback, mpc) {
  let count = 0
  for (let i = 0; i< kps.length; i++) {
    if (kps[i] === null || kps[i].score < mpc)
      count++
  }
  if (count !== 17) {
    return feedbackWrapper(feedback, [])
  }
  return feedbackWrapper("", [])
}

/**
 * Check the pose of the user
 * @param keypoints An array of key-points of the user
 * @param check
 * @param mpc minPartConfidence
 * @return {Object} Check, contains the feedback with the affected keypoints
 */
export function checkHeuristics(keypoints, check, mpc) {
  // get in screen (init)
  var feedbackArray = []
 // feedbackArray.push(inScreen(keypoints, "Move more in screen.", 0.5))
  // exercise checks
  feedbackArray = feedbackArray.concat(checkFrontSideSquat(keypoints, mpc))



  //per check gaan we een entry in onze array bijvoegen
  for (var i = 0; i < feedbackArray.length; i++) {
    var fb = {occurances: 0, text: feedbackArray[i].text, keypoints: feedbackArray[i].keypoints}

    //if object not found then init object!
    if (check[i]) {
      fb.occurances = check[i].occurances
    }

    if (fb.text !== "") {
      fb.occurances += 1
    }

    if (check[i] === null) {
      check.push(fb)
    } else {
      check[i] = fb
    }
  }
  return check
}

//===============================================IMPLEMENT EXERCISE HERE==============================================
function checkFrontSideSquat(keypoints, mpc) {
  var feedbackArray = []

  // Hips need to be horizontal
  feedbackArray.push(horizontal(keypoints, Keypoints.leftHip, Keypoints.rightHip, 5, "Your hips need to be parallel to the ground", mpc))

  // Shoulders need to be horizontal
  feedbackArray.push(horizontal(keypoints, Keypoints.leftShoulder, Keypoints.rightShoulder, 5, "Your shoulders need to be parallel to the ground", mpc))

  // Squat can not go lower then 20 (experimentally determined)
  feedbackArray.push(distanceBetween2Lines(keypoints, Keypoints.leftHip, Keypoints.rightHip, Keypoints.leftKnee, Keypoints.rightKnee, 20, "You are going to low.", mpc))

  // Check neutral pose
  // left side
  feedbackArray.push(verticalRange(keypoints, Keypoints.leftShoulder, Keypoints.leftAnkle, -85, 90,
    "Move your left foot more to the right",
    "Move your left foot more to the left", mpc))

  // right side
  feedbackArray.push(verticalRange(keypoints, Keypoints.rightShoulder, Keypoints.rightAnkle, 85, 90,
    "Move your right foot more to the right",
    "Move your right foot more to the left", mpc))

  let KneeFootThreshold = 10

  // knee-ankle alignment
  // left side
  feedbackArray.push(vertical(keypoints, Keypoints.leftKnee, Keypoints.leftAnkle, KneeFootThreshold,
    "Move your left knee more to the right",
    "Move your left knee more to the left", mpc))

  // right side
  feedbackArray.push(vertical(keypoints, Keypoints.rightKnee, Keypoints.rightAnkle, KneeFootThreshold,
    "Move your right knee more to the right",
    "Move your right knee more to the left", mpc))

  return feedbackArray
}

//TODO: implement exercise (MARK)

