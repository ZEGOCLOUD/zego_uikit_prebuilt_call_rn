const durationFormat = (duration) => {
    let s = duration || 0;
    let m = 0;
    let h = 0;
    if (s >= 60) {
        m = parseInt(`${s / 60}`);
        s = parseInt(`${s % 60}`);
        if (m >= 60) {
            h = parseInt(`${m / 60}`);
            m = parseInt(`${m % 60}`);
        }
    }
    let result = `${s}`;
    if (s < 10) {
        result = `0${result}`;
    }
    if (m > 0) {
        result = `${m}:${result}`;
        if (m < 10) {
            result = `0${result}`;
        }
    } else {
        result = `00:${result}`;
    }
    if (h > 0) {
        result = `${h}:${result}`;
        if (h < 10) {
            result = `0${result}`;
        }
    } else {
        // result = `00:${result}`;
    }
    return result;
}

export { durationFormat };
