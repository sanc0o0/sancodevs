export const PASSWORD_RULES = {
    minLength: 8,
    hasUpper: /[A-Z]/,
    hasLower: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[^A-Za-z0-9]/,
};

export function validatePassword(password: string): string | null {
    if (password.length < PASSWORD_RULES.minLength) {
        return `Password must be at least ${PASSWORD_RULES.minLength} characters.`;
    }
    if (!PASSWORD_RULES.hasUpper.test(password)) {
        return "Password must include at least one uppercase letter.";
    }
    if (!PASSWORD_RULES.hasLower.test(password)) {
        return "Password must include at least one lowercase letter.";
    }
    if (!PASSWORD_RULES.hasNumber.test(password)) {
        return "Password must include at least one number.";
    }
    if (!PASSWORD_RULES.hasSpecial.test(password)) {
        return "Password must include at least one special character.";
    }
    return null;
}