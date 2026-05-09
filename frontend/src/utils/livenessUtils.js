/**
 * Liveness Geometry Utilities
 * Based on Python final_engine.py logic
 */

/**
 * Calculates Euclidean distance between two points
 */
export const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Calculates Eye Aspect Ratio (EAR) for blink detection
 * Formula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 */
export const calculateEAR = (eye) => {
    // eye is an array of 6 points
    const p1 = eye[0];
    const p2 = eye[1];
    const p3 = eye[2];
    const p4 = eye[3];
    const p5 = eye[4];
    const p6 = eye[5];

    const vertical1 = distance(p2, p6);
    const vertical2 = distance(p3, p5);
    const horizontal = distance(p1, p4);

    return (vertical1 + vertical2) / (2.0 * horizontal);
};

/**
 * Calculates Head Pose (Turn X and Pitch Y)
 * Matches final_engine.py logic
 * le: Left Eye Center
 * re: Right Eye Center
 * n: Nose Tip
 * h: Face Height
 */
export const calculateHeadPose = (leftEye, rightEye, nose, faceBox) => {
    const le = {
        x: (leftEye[0].x + leftEye[3].x) / 2,
        y: (leftEye[1].y + leftEye[4].y) / 2
    };
    const re = {
        x: (rightEye[0].x + rightEye[3].x) / 2,
        y: (rightEye[1].y + rightEye[4].y) / 2
    };
    const n = nose[3] || nose[0]; // Usually nose tip is point 4 in the nose bridge (index 30 in 68-pt)

    const minX = Math.min(le.x, re.x);
    const maxX = Math.max(le.x, re.x);
    const eyeWidth = maxX - minX;

    if (eyeWidth <= 0) return { turnX: 0.5, pitchY: 0.5 };

    const eyeYCenter = (le.y + re.y) / 2;
    const faceHeight = faceBox.height;

    const turnX = (n.x - minX) / eyeWidth;
    const pitchY = (n.y - eyeYCenter) / faceHeight;

    return { turnX, pitchY };
};

export const CHALLENGES = [
    { id: 'LOOK UP', instruction: 'Look slowly at the ceiling' },
    { id: 'LOOK LEFT', instruction: 'Turn your head to the left' },
    { id: 'LOOK RIGHT', instruction: 'Turn your head to the right' }
];
