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

    isAt(seconds) {
        let ms = seconds * 1000;
        let tolerance = 500; // +/- 500 ms
        let elapsed = millis()-this.time_start;
        return (elapsed < (ms+tolerance)) && (elapsed > (ms-tolerance));
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