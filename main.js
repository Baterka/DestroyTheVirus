class Game {
    html = document.getElementsByTagName('html')[0];
    canvas = document.getElementById('canvas');
    target = document.getElementById('target');

    canvasOffset = {
        x: 0,
        y: 0
    }

    targetSize = {
        width: 0,
        height: 0
    }

    mapBoundary = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    }

    constructor(player) {
        this.Player = player;
        window.addEventListener("resize", this._debounce(this._onWindowResize.bind(this)));
    }

    /**
     * Called after DOM rendered
     */
    init() {
        const targetRect = this.target.getBoundingClientRect();
        this.targetSize = {
            width: targetRect.width / 2,
            height: targetRect.height / 2
        }

        const canvasRect = this.canvas.getBoundingClientRect();
        this.mapBoundary = {
            minX: 0,
            minY: 0,
            maxX: canvasRect.width - this.targetSize.width * 2,
            maxY: canvasRect.height - this.targetSize.width * 2
        }

        this._onWindowResize();

        this.canvas.addEventListener('inputChange', e => {
            let x = (e.clientX - this.canvasOffset.x);
            let y = (e.clientY - this.canvasOffset.y);

            // Allow "corner sliding"
            x = (x > this.mapBoundary.minX ? (x < this.mapBoundary.maxX ? x : this.mapBoundary.maxX) : this.mapBoundary.minX)
            y = (y > this.mapBoundary.minY ? (y < this.mapBoundary.maxY ? y : this.mapBoundary.maxY) : this.mapBoundary.minY)

            this.target.style.left = x + "px";
            this.target.style.top = y + "px";
        });
    }

    /**
     * Called on window resize (if not resized for more than 50ms to avoid lag)
     */
    _onWindowResize() {
        this.canvasOffset = {
            x: this.canvas.offsetLeft + this.targetSize.width,
            y: this.canvas.offsetTop + this.targetSize.height
        }
        console.log("Window resized! New cancas offset:", this.canvasOffset);
    }

    /**
     * Used to prevent window resize lag.
     * https://stackoverflow.com/questions/45905160/javascript-on-window-resize-end
     */
    _debounce(endFunc) {
        let timer;
        return event => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(endFunc, 50, event);
        };
    }
}

class Player {

    constructor(initialInputType) {

        // ENUM: keyboard, mouse
        this.radio_input = initialInputType

        console.log("Initial input type:", this.radio_input);
    }

    changeInput(radioElem) {
        if (radioElem.value !== this.radio_input) {
            this.radio_input = radioElem.value;
            console.log("Input type changed to:", this.radio_input);
        }
    }
}

const player = new Player(document.querySelector('input[name="input"]:checked').value);
const game = new Game(player);