export const microtime = (getAsFloat: boolean = true) => {
    let s, now, multiplier;

    if (typeof performance !== 'undefined' && performance.now) {
        now = (performance.now() + performance.timing.navigationStart) / 1000;
        multiplier = 1e6; // 1,000,000 for microseconds
    } else {
        now = (Date.now ? Date.now() : new Date().getTime()) / 1000;
        multiplier = 1e3; // 1,000
    }

    // Getting microtime as a float is easy
    if (getAsFloat) {
        return now;
    }

    // Dirty trick to only get the integer part
    s = now | 0;

    return (Math.round((now - s) * multiplier ) / multiplier ) + ' ' + s;
}

export const camelToSnake = str => str.replace(/[A-Z]/g, (char: string) => '_' + char.toLowerCase());
export const snakeToCamel = str => str.replace(/_[a-z]/g, (char: string) => char.toUpperCase().replace('_', ''));