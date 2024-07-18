import BackgroundTimer from "./background_timer";

export default class Timer {
    constructor(callback, interval) {
        this.callback = callback;
        this.interval = interval;
        this.startTime = null;
        this.requestId = null;
        this.isRunning = false;
        this.count = 0;
        this.lastElapsed = 0;
        this.averageElapsed = 0;
    }
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            this.tick(); // Call tick method to start the timer
            
            this.requestId = BackgroundTimer.setInterval(() => {
              this.tick();
            }, 100);
        }
    }
    stop() {
        if (this.isRunning) {
            this.isRunning = false;

            // cancelAnimationFrame(this.requestId);
            BackgroundTimer.clearInterval(this.requestId);
        }
    }
    tick() {
        const elapsed = Date.now() - this.startTime;
        const deltaElapsed = elapsed - this.lastElapsed;
        this.lastElapsed = elapsed;
        this.averageElapsed = (this.averageElapsed * this.count + deltaElapsed) / (this.count + 1);
        this.count++;
        if ((elapsed + this.averageElapsed / 2) >= this.interval) {
            this.callback(elapsed);
            this.startTime = Date.now();
            this.count = 0;
            this.lastElapsed = 0;
            this.averageElapsed = 0;
        }
        // this.requestId = requestAnimationFrame(this.tick.bind(this));
    }
}

export const getLocalDateFormat = () => {
    function addLeadingZero(value, totalDigits = 2) {
        const stringValue = value.toString();
        const padding = '0'.repeat(totalDigits - stringValue.length);
        return padding + stringValue;
      }
    
      const now = new Date();
      const month = addLeadingZero(now.getMonth() + 1);
      const day = addLeadingZero(now.getDate());
      const hours = addLeadingZero(now.getHours());
      const minutes = addLeadingZero(now.getMinutes());
      const seconds = addLeadingZero(now.getSeconds());
      const milliseconds = addLeadingZero(now.getMilliseconds(), 4);
      const formattedDateTime = `${month}${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

      return formattedDateTime
}
