const randomNumber = (min, max) => {
    return Math.floor((Math.random() * max) + min);
}

class AudioController {

    _audioElems = {};

    constructor() {
        const audioTracks = {
            // https://freesound.org/people/InspectorJ/sounds/484344/
            success: "./success.wav",
            // https://freesound.org/people/LorenzoTheGreat/sounds/417794/
            fail: "./fail.wav"
        }


        for (let key in audioTracks) {
            this._audioElems[key] = document.createElement("source");
            this._audioElems[key].src = audioTracks[key];
            console.log(`[AUDIO] Source '${key}' loaded.`);
        }
    }

    play(name) {
        if (this._audioTracks[name]) {
            this._audioElem.pause();
            this._audioElem.currentTime = 0;
            this._audioElem.src = this._audioTracks.fail;
            this._audioElem.play();
        } else
            console.error(`[AUDIO] Source '${name}' does not exist.`);
    }
}

class Game {


    // Will be loaded after DOM will be rendered
    _World = null;
    _Player = null;
    _Virus = null;

    // Audio
    _Audio = new AudioController();


    _buttonNewGameElem = document.getElementById('button_newGame');

    tps = 60;


    // ENUM: RUNNING, GAMEOVER
    gameState = "GAMEOVER"

    constructor() {
        //setInterval(() => this._tick(), 1000 / this.tps);

        setInterval(() => this._Audio.play("fail"), 300);
    }

    /**
     * Called after DOM rendered
     */
    init() {
        this._World = new World(this);
        this._Player = new Player(this, document.querySelector('input[name="input"]:checked'));
        this._Virus = new Virus(this);

        this._buttonNewGameElem.addEventListener("click", e => {
            if (this.gameState !== "RUNNING") {
                this._World.toggleGameOver(true);
                this._Player._Virus.toggleSpawning(true);
                this._buttonNewGameElem.disabled = true;
                this._Player.resetScore()
            }
        });
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

    addScore() {
        this._successAudioElem.pause();
        this._successAudioElem.currentTime = 0;
        this._successAudioElem.play();
        this._Player.setScore(1);
    }

    deleteScore() {
        this._failAudioElem.pause();
        this._failAudioElem.currentTime = 0;
        this._failAudioElem.play();
        this._Player.setScore(-1);

        if (this._Player.missed >= this._Player.maxMissed || this._Player.score < 0) {
            this._World.toggleGameOver();
            this._Player._Virus.toggleSpawning(false);
            this.gameState === "GAMEOVER";
            this._buttonNewGameElem.disabled = false;
        }
    }
}

class Player {

    canvas = document.getElementById('canvas');
    _scoreElem = document.getElementById('score');
    _eliminatedElem = document.getElementById('eliminated');
    _missedElem = document.getElementById('missed');

    keyboardSpeed = 10;

    pos = {
        x: 0,
        y: 0
    }

    score = 0;
    eliminated = 0;
    missed = 0;

    maxMissed = 3;



    constructor(game, radioElem) {
        // Reference to Game controller
        this._Game = game;

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

    resetScore() {
        this.score = 0;
        this.eliminated = 0;
        this.missed = 0;

        this._scoreElem.innerHTML = this.score;
        this._eliminatedElem.innerHTML = this.eliminated;
        this._missedElem.innerHTML = this.missed;
    }

    setScore(add) {
        this.score += add;
        if (add > 0)
            this.eliminated++;
        if (add < 0)
            this.missed++;

        this._scoreElem.innerHTML = this.score;
        this._eliminatedElem.innerHTML = this.eliminated;
        this._missedElem.innerHTML = this.missed;
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

    _list = {};

    _spawningEnabled = false;

    _spawnRate = 2000;

    constructor(game) {
        // Reference to Game controller
        this._Game = game;

        this._virusElem.className = "virus";
        const clickableElem = document.createElement("div");
        clickableElem.className = "clickable";
        clickableElem.onClick = e => {
            console.log(e);
        }
        this._virusElem.appendChild(clickableElem);

        if (this._spawningEnabled)
            this._spawner();
    }

    _spawner() {
        setTimeout(() => {
            if (!this._spawningEnabled)
                return;
            const x = randomNumber(this._Game.mapBoundary.minX, this._Game.mapBoundary.maxX + 15);
            const y = randomNumber(this._Game.mapBoundary.minY, this._Game.mapBoundary.maxY - 13);
            this.spawn(x, y);
            console.log(this._spawnRate);
            this._spawner();
        }, --this._spawnRate);
    }

    toggleSpawning(enable) {
        this._spawningEnabled = enable;
        console.log("Virus spawning:", enable ? "enabled" : "disabled");
        if (this._spawningEnabled)
            this._spawner();
    }

    spawn(x, y) {
        const virusElem = this._virusElem.cloneNode(true);
        virusElem.style.left = x + "px";
        virusElem.style.top = y + "px";
        virusElem.id = this._list.length;
        this._list[virusElem.id] = virusElem;
        this._parentElem.appendChild(virusElem);
        this._autoHide(virusElem.id);
    }

    _autoHide(id) {
        setTimeout(() => {
            const elem = this._list[id];
            if (!elem)
                return;
            this._Game.deleteScore();
            elem.remove();
            delete this._list[id];
        }, 1000);
    }

    /**
     * Handling clicks on viruses
     */
    onClick(id) {
        if (!this._spawningEnabled)
            return;
        const elem = this._list[id];
        if (!elem)
            return;
        elem.remove();
        this._Game.addScore();
        delete this._list[id];
    }
}

class World {
    _canvas = document.getElementById('canvas');

    _target = document.getElementById('target');

    _canvasOffset = {
        x: 0,
        y: 0
    }

    _targetRect = this._target.getBoundingClientRect();
    _targetDimensions = {
        width: this._targetRect.width,
        height: this._targetRect.height
    }

    // DeadZone
    _deadZoneElem = document.getElementById("deadZone");
    _deadZoneWidth = 0;

    // GameOver
    _gameOverElem = document.getElementById("gameOver");

    constructor() {
        // Reference to Game controller
        this._Game = game;

        window.addEventListener("resize", () => {
            this._debounceResize(this._onWindowResize.bind(this))
        });

        this._onWindowResize();
    }

    inceraseDeadZone() {

    }

    toggleGameOver(visible) {
        this._gameOverElem.style.display = visible ? "none" : "flex";
    }

    /**
     * Called on window resize (if not resized for more than 50ms to avoid lag)
     */
    _onWindowResize() {
        this.canvasOffset = {
            x: this._canvas.offsetLeft + this._targetDimensions.width,
            y: this._canvas.offsetTop + this._targetDimensions.height
        }
        console.log("Window resized! New cancas offset:", this.canvasOffset);
    }

    /**
     * Used to prevent lag on window resize event.
     * https://stackoverflow.com/questions/45905160/javascript-on-window-resize-end
     */
    _debounceResize(endFunc) {
        let timer;
        return event => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(endFunc, 50, event);
        };
    }
}

const game = new Game();