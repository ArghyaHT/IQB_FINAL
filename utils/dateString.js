export const formatDateWithSuffix = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });

    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return "th"; // 4th, 5th, ..., 20th
        switch (day % 10) {
            case 1: return "st"; // 1st, 21st, 31st
            case 2: return "nd"; // 2nd, 22nd
            case 3: return "rd"; // 3rd, 23rd
            default: return "th"; // 4th, 5th, 6th...
        }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}`;
};