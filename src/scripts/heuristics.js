//TODO: maybe: if not feedback is given generate default feedback
//TODO: document the code

/* EXPLANATION
* Ik wil een makkelijkere uitvoering methode maken voor een bepaalde oefening:
*
* We willen dus een oefening encoderen door bepaalde checks
* Exercise heeft meerdere checks die hij moet doen
* Een check kan verschillende dingen zijn
* - Check of 2 gegeven punten horizontaal of verticaal zijn (dit kan geimplementeerd worden door  puntje 2 hoek 0
* - Check of een lijn tussen 2 punten in een bepaalde hoek ligt (dit kan horizontaal of verticaal)
* - Check of een lijn tussen 3 punten (de hoek die hieruit volgt) in een bepaalde hoek ligt
* - Check afstand tussen 2 punten
* - check afstand tussen 2 lijnen (middelpunten van elke lijn)
* */

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
function distanceBetween2Points(point1, point2) { //length of line
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

function feedbackWrapper(text, keypoints) {
  return {text: text, keypoints: keypoints}
}

function angleBetween3Points(point1, pivot, point2) {
  const b = distanceBetween2Points(point1, pivot)
  const a = distanceBetween2Points(pivot, point2)
  const c = distanceBetween2Points(point1, point2)

  const pivotAngleInRadians = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b))
  const pivotAngleInDegrees = pivotAngleInRadians * 180 / Math.PI

  return pivotAngleInDegrees
}

function useableKeypoints(kps, mpc) {
  for (let i = 0; i < kps.length; i++) {
    if (kps[i] === null || kps[i].score < mpc) {
      return false
    }
  }
  return true
}

/*function getOrientedAngle(angle, orientation) {
  var changedAngle = angle

  switch (orientation) {
    case "N":
      // do nothing (right orientation)
      break;
    case "E":
      changedAngle = angle + 90
      break;
    case "S":
      changedAngle = angle + 180
      break;
    case "W":
      changedAngle = angle - 90
      break;
  }

  while (changedAngle > 90) {
    changedAngle -= 90
  }

  while (changedAngle < -90) {
    changedAngle += 90
  }

  return changedAngle
}*/

//===============================================BUILDING BLOCKS=====================================================

/**
 * Gives the distance between 2 lines, calculated from 4 points,
 * line1: point1 and point2
 * line2: point3 and point4
 * @param kps
 * @param point1
 * @param point2
 * @param point3
 * @param point4
 * @param distance
 * @param feedback
 * @param mpc
 * @return {*}
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
 * See if the 2 given keypoints are horizontal.
 * @param kps
 * @param {*} point1: First key-point
 * @param {*} point2: Second key-point
 * @param {Number} mpc: The minPartConfidence
 * @param {Number} threshold: The error in degrees that is allowed
 * @param {String} feedback: The string that is returned when kepoints are not horizontal
 * @returns {Object} feedback The feedback that is returned when keypoints are not horizontal
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

//TODO: fix this one!
/**
 *
 * @param kps
 * @param point1
 * @param point2
 * @param threshold
 * @param feedback1
 * @param feedback2
 * @param mpc
 * @return {string|*}
 */
function vertical(kps, point1, point2, threshold, feedback1, feedback2, mpc) {
  const p1 = kps[point1]
  const p2 = kps[point2]

  if (useableKeypoints([p1, p2], mpc)) {
    const angle = Math.atan((p2.position.y - p1.position.y) / (p2.position.x - p1.position.x)) * 180 / Math.PI;

    if (angle < 0 && angle > -90 + threshold) {
      //too much to the right (need to move left)
      return feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    } else if (angle > 0 && angle < 90 - threshold) {
      //too much to the left (need to move right)
      return feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
    }
  }
  return feedbackWrapper("", [])
}

/**
 *
 * @param kps
 * @param point1: highest point
 * @param point2: lowest point
 * @param angle1
 * @param angle2
 * @param feedback1
 * @param feedback2
 * @param mpc
 * @return {string|*}
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
 * @param kps
 * @param point1
 * @param pivot
 * @param point2
 * @param angle
 * @param threshold
 * @param feedback1: feedback string returned when calculated angle is smaller then given angle
 * @param feedback2: feedback string returned when calculated angle is bigger then given angle
 * @param mpc
 * @return {Object} returns proper text feedback
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
 * @param kps
 * @param point1
 * @param pivot
 * @param point2
 * @param angle1
 * @param angle2
 * @param feedback1: feedback string returned when calculated angle is smaller then given angle
 * @param feedback2: feedback string returned when calculated angle is bigger then given angle
 * @param mpc
 * @return {string} returns proper text feedback
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
 * Check the pose of the user
 * @param keypoints An array of key-points of the user
 * @param check
 * @param mpc minPartConfidence
 * @return {*}
 */
export function checkHeuristics(keypoints, check, mpc) {
  //TODO: insert exercises we made below
  var feedbackArray = checkFrontSideSquat(keypoints, mpc)

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

//TODO: implement 3 exercises like the example above
//1. horizontal shoulders
//2. vertical posture (feet need to be as wide as shoulders)
//3. angle of knee lies between 180 and 90 degrees

function excersise1() {
  var array = []
  return array
}

function excersise2() {
  var array = []
  return array
}

function excersise3() {
  var array = []
  return array
}
