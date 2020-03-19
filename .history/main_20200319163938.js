const randomNumber = (min, max) => {
    return Math.floor((Math.random() * max) + min);
}

class Game {
    html = document.getElementsByTagName('html')[0];
    canvas = document.getElementById('canvas');
    target = document.getElementById('target');

    _successAudioElem = document.getElementById("successAudioElem");

    tps = 60;

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

    constructor(player, world) {
        this._Player = player;
        this._World = world;
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
        let x = (this._Player.pos.x - this.canvasOffset.x);
        let y = (this._Player.pos.y - this.canvasOffset.y);

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

    addScore() {
        this._successAudioElem.play();
    }

    deleteScore() {

    }
}

class Player {

    canvas = document.getElementById('canvas');

    keyboardSpeed = 10;

    pos = {
        x: 0,
        y: 0
    }

    score = 0;
    eliminated = 0;
    missed = 0;

    maxMissed = 3;

    _Virus = null;

    constructor(radioElem) {
        this.changeInput(radioElem);

        // Start listening to input events
        this._listenToEvents();
    }


    setVirus(virus) {
        this._Virus = virus;
    }

    changeInput(radioElem) {
        if (radioElem.value !== this.radio_input) {
            this.radio_input = radioElem.value;
            console.log("Input type changed to:", this.radio_input);
        }
    }

    _listenToEvents() {
        this.canvas.addEventListener("mousemove", e => {
            if (this.radio_input !== 'mouse')
                return;

            this.pos = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener("click", e => {
            const parent = e.target.parentElement;
            if (parent.className == 'virus') {
                console.log("Clicked on virus ID:", parent.id);
                if (!this._Virus)
                    return console.error("Virus Manager is not attached. Cannot call onClick action!");
                this._Virus.onClick(parent.id);
            }
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
}

class Virus {
    _parentElem = document.getElementById('virusses');
    _virusElem = document.createElement("div");

    _list = [];

    constructor(game) {
        this._Game = game;
        this._virusElem.className = "virus";
        const clickableElem = document.createElement("div");
        clickableElem.className = "clickable";
        clickableElem.onClick = e => {
            console.log(e);
        }
        this._virusElem.appendChild(clickableElem);

        setInterval(() => {
            const x = randomNumber(this._Game.mapBoundary.minX, this._Game.mapBoundary.maxX);
            const y = randomNumber(this._Game.mapBoundary.minY, this._Game.mapBoundary.maxY);
            this.spawn(x, y);
        }, 2000);
    }

    spawn(x, y) {
        const virusElem = this._virusElem.cloneNode(true);
        virusElem.style.left = x + "px";
        virusElem.style.top = y + "px";
        virusElem.id = this._list.length;
        this._list.push(virusElem);
        this._parentElem.appendChild(virusElem);
        this._autoHide(virusElem);
    }

    _autoHide(elem) {
        setTimeout(() => {
            elem.remove()
        }, 1000);
    }

    /**
     * Handling clicks on viruses
     */
    onClick(id) {
        const elem = this._list[id];
        elem.remove();
        this._Game.addScore();
    }
}

class World {
    _gameOverElem = document.getElementById("gameOver");

    constructor() {

    }

    toggleGameOver(hide = false) {
        this._gameOverElem.style.display = hide ? "none" : "flex";
    }
}

const world = new World();
const player = new Player(document.querySelector('input[name="input"]:checked'));
const game = new Game(player, world);
const virus = new Virus(game);
player.setVirus(virus);