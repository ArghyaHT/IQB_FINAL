import moment from 'moment-timezone';

export const getIANATimeZone = (timeZone) => {
    const offsetMatch = timeZone.match(/UTC([+-])(\d{2}):?(\d{2})?/);
    if (!offsetMatch) return 'Etc/UTC';

    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3] || '0', 10);
    const totalOffsetMinutes = (hours * 60 + minutes) * sign;

    const now = new Date();

    // Find all matching time zones with the same offset
    const matchedTimeZones = moment.tz.names().filter(zone => {
        return moment.tz(zone).utcOffset(now) === totalOffsetMinutes;
    });

    // Return the first match or fallback to Etc/UTC
    return matchedTimeZones.length > 0 ? matchedTimeZones[0] : 'Etc/UTC';
};