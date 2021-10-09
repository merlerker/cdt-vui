class Timer {
    constructor() {
        this.time_start = millis();
        this.time_end = millis();
    }

    elapsed(seconds) {
        let ms = seconds * 1000;
        this.stop();
        return (this.time_end-this.time_start) > ms;
    }

    start() {
        this.time_start = millis();
        this.time_end = millis();
    }

    stop() {
        this.time_end = millis();
    }

    currentTime() {
        return (this.time_end-this.time_start)/1000;
    }
}