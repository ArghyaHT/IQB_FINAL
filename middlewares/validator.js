// Function to validate email format
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


export const validateName = (name) => {
    if (typeof name !== 'string') {
        return false;
    }

    // Regular expression to match only alphabetic characters
    const regex = /^[A-Za-z]+$/;

    return regex.test(name);
};
