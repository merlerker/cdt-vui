
// Code from Visualizing Data, Second Edition, Copyright Ben Fry.

class SoftFloat {

    static ATTRACTION = 0.5; //.1
    static DAMPING = 0.3; //.2

    constructor(value, attraction, damping, jitter) {
        this.value = value;
        this.attraction = attraction || SoftFloat.ATTRACTION;
        this.damping = damping;
        this.target_jitter = jitter; // jitter during target transitioning
        this.tolerance = .05; // looser tolerance when we have jitter, so we can count the transition as complete

        // default values
        if (damping==undefined) {
            this.damping = SoftFloat.DAMPING;
        }
        // if (attraction==undefined) {
        //     this.attraction = SoftFloat.ATTRACTION;
        // }
        if (jitter==undefined) {
            this.target_jitter = 0;
            this.tolerance = .0001; // tighter tolerance without jitter, so we reach the actual target
        }

        this.velocity = 0;
        this.acceleration = 0;

        this.targeting = false;
        this.target = value;
    }


    set(v) {
        this.value = v;
        this.target = v;
        this.targeting = false;
    }


    get() {
        return this.value;
    }


    getInt() {
        return parseInt(this.value);
    }


    setAttraction(a) {
        this.attraction = a;
    }


    getAttraction() {
        return attraction;
    }


    setDamping(d) {
        this.damping = d;
    }


    getDamping() {
        return this.damping;
    }


    // update the float towards its target
    // if there are no more updates to make (arrived at target) return false
    update() {
        if (this.targeting) {
            this.acceleration += this.attraction * (this.target - this.value);
            this.velocity = (this.velocity + this.acceleration) * this.damping;
            this.value += this.velocity;
            if (this.target_jitter>0) { this.value += random(-this.target_jitter, this.target_jitter);}
            this.acceleration = 0;
            if (Math.abs(this.velocity) > this.tolerance) {
                return true;
            }
            // arrived, set it to the target value to prevent rounding error
            this.value = this.target;
            this.targeting = false;
        }
        return false;
    }

    // jitter the value
    jitter(amt) {
        if (amt == undefined) {
            amt = 1;
        }
        this.value += random(-amt, amt);
    }


    setTarget(t) {
        this.targeting = true;
        this.target = t;
    }


    getTarget() {
        return this.target;
    }


    atTarget() {
        if (!this.targeting) {
            return true;
        }
        return Math.abs(this.value - this.target) < this.tolerance;
    }


    getTargetInt() {
        return parseInt(this.target);
    }


    isTargeting() {
        return this.targeting;
    }


    noTarget() {
        this.targeting = false;
    }
}
