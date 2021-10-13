class ImgSequence {

    static FRAMERATE = 5;

    constructor(path, num_files, x, y) {
        // this.images = [...img_lst]; // shallow copy
        this.images = [];
        
        for (let i=0; i++; i<num_files) {
            let img = loadImage(path+`/vui_states_${i}`);
            this.images.push(img);
        }
        this.x = x;
        this.y = y;
        this.current_frame = 0; // animation frames (slower)
        this.total_frames = this.images.length;
        this.frame_count = 0; // p5 frames (faster)
    }

    show(cnv) {
        // we've played all the frames, return false
        if (this.current_frame > this.total_frames) {
            this.current_frame = 0;
            return false;
        }

        // play the next frame, if our p5 frame_count aligns with the desired framerate
        if (this.frame_count > ImgSequence.FRAMERATE) {
            cnv.image(this.images[this.current_frame], this.x, this.y);
            this.current_frame++;
            this.frame_count = 0; // reset frame counter
        }

        this.frame_count++; // count every p5 frame
        return true;
    }
}