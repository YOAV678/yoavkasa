const config = {
    passwordPolicy: {
        minLength: 10,
        complexity: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            specialCharacters: true
        },
        history: 3,
        dictionaryCheck: true,
        loginAttempts: 3
    },
    dictionary: [
        "password",
        "123456",
        "admin",
        "welcome"
    ]
};

/**
 * פונקציה לבדיקת מדיניות סיסמה
 * @param {string} password - הסיסמה לבדיקה.
 * @param {Array<string>} history - היסטוריית סיסמאות קודמות של המשתמש.
 * @returns {boolean} - האם הסיסמה עומדת בתנאים.
 */
export function validatePassword(password, history = []) {
    const policy = config.passwordPolicy;

    // בדיקת אורך מינימלי
    if (password.length < policy.minLength) {
        console.error("Password is too short.");
        return false;
    }

    // בדיקת מורכבות
    if (policy.complexity.uppercase && !/[A-Z]/.test(password)) {
        console.error("Password must contain at least one uppercase letter.");
        return false;
    }
    if (policy.complexity.lowercase && !/[a-z]/.test(password)) {
        console.error("Password must contain at least one lowercase letter.");
        return false;
    }
    if (policy.complexity.numbers && !/[0-9]/.test(password)) {
        console.error("Password must contain at least one number.");
        return false;
    }
    if (policy.complexity.specialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        console.error("Password must contain at least one special character.");
        return false;
    }

    // בדיקת היסטוריה
    if (history.includes(password)) {
        console.error("Password has been used recently.");
        return false;
    }

    // בדיקת מילון
    if (policy.dictionaryCheck && config.dictionary.includes(password.toLowerCase())) {
        console.error("Password is too common.");
        return false;
    }

    console.log("Password is valid.");
    return true;
}

// דוגמת שימוש:
 // דוגמת היסטוריה


