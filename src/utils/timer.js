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