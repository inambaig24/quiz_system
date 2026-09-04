/**
 * Online Quiz System - Timer module helper
 * Timing functions are integrated into quiz.js for high cohesion,
 * but this file serves to handle any custom standalone timing features.
 */

class QuizTimer {
    constructor(durationMinutes, onTick, onComplete) {
        this.timeRemaining = durationMinutes * 60;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.interval = null;
    }

    start() {
        if (this.interval) clearInterval(this.interval);
        
        this.interval = setInterval(() => {
            this.timeRemaining--;
            if (typeof this.onTick === 'function') {
                this.onTick(this.timeRemaining);
            }

            if (this.timeRemaining <= 0) {
                this.stop();
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getFormattedTime() {
        const m = Math.floor(this.timeRemaining / 60);
        const s = this.timeRemaining % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
