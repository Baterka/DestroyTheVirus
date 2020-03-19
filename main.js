class Game {
    html = document.getElementsByTagName('html')[0];
    canvas = document.getElementById('canvas');
    target = document.getElementById('target');
    tps = 30;

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

        setInterval(() => this._tick(), 1000 / this.tps);
    }

    /**
     * Game tick
     */
    _tick() {
        let x = (this.Player.pos.x - this.canvasOffset.x);
        let y = (this.Player.pos.y - this.canvasOffset.y);

        // Allow "corner sliding"
        x = (x > this.mapBoundary.minX ? (x < this.mapBoundary.maxX ? x : this.mapBoundary.maxX) : this.mapBoundary.minX)
        y = (y > this.mapBoundary.minY ? (y < this.mapBoundary.maxY ? y : this.mapBoundary.maxY) : this.mapBoundary.minY)

        this.target.style.left = x + "px";
        this.target.style.top = y + "px";
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

    canvas = document.getElementById('canvas');

    keyboardSpeed = 10;

    pos = {
        x: 0,
        y: 0
    }

    constructor(radioElem) {
        this.changeInput(radioElem);

        this.canvas.addEventListener("mousemove", e => {
            if (this.radio_input !== 'mouse')
                return;

            this.pos = { x: e.clientX, y: e.clientY };
        });
        document.addEventListener("keydown", e => {
            if (this.radio_input !== 'keyboard')
                return;

            switch (e.key) {
                case "w":
                    this.pos.y -= this.keyboardSpeed;
                    break;
                case "s":
                    this.pos.y += this.keyboardSpeed;
                    break;
                case "a":
                    this.pos.x -= this.keyboardSpeed;
                    break;
                case "d":
                    this.pos.x += this.keyboardSpeed;
                    break;
                default:
                    console.log("Undefined key pressed:", e.key);
                    break;
            }
        });
    }

    changeInput(radioElem) {
        if (radioElem.value !== this.radio_input) {
            this.radio_input = radioElem.value;
            console.log("Input type changed to:", this.radio_input);
        }
    }
}

const player = new Player(document.querySelector('input[name="input"]:checked'));
const game = new Game(player);