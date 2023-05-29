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

const getMethodReturnValue = async (func) => {
    let result = true;
    if (func) {
        if (typeof func === 'object' && typeof (func.then) === 'function' && typeof (func.catch) === 'function') {
          // Promise
          try {
            result = await func;
          } catch (error) {
            result = false;
          }
        } else if (typeof func === 'function') {
          const temp = func();
          if (typeof temp === 'object' && typeof (temp.then) === 'function' && typeof (temp.catch) === 'function') {
            try {
              result = await temp;
            } catch (error) {
              result = false;
            }
          } else {
            result = temp;
          }
        }
    }
    return result;
}

export { durationFormat, getMethodReturnValue };
