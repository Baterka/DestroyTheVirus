const debug = true;

const randomNumber = (min, max) => {
    //return Math.floor((Math.random() * (max - min + 1)) + min);
    return max;
}

class Audio {

    globalVolume = 0.25;

    _sources = {
        // https://freesound.org/people/InspectorJ/sounds/484344/
        success: "./success.wav",
        // https://freesound.org/people/LorenzoTheGreat/sounds/417794/
        fail: "./fail.wav"
    }

    tracks = {};

    constructor() {
        for (let key in this._sources) {
            this.tracks[key] = document.createElement("audio");
            this.tracks[key].volume = this.globalVolume;
            this.tracks[key].src = this._sources[key];
            console.log(`[AUDIO] Source '${key}' loaded.`);
        }
    }

    play(track) {
        if (!track)
            console.error(`[AUDIO] Source '${name}' does not exist.`);
        track.currentTime = 0;
        track.play();
    }
}

class Game {
    // Will be loaded after DOM will be rendered
    World = null;
    Player = null;
    Virus = null;

    // Audio
    _Audio = new Audio();

    // Ticks per second (frames-per-second)
    tps = 60;

    // ENUM: RUNNING, GAMEOVER
    gameState = "GAMEOVER"

    constructor(debug) {
        this.debug = debug;
    }

    /**
     * Called after DOM rendered
     */
    init() {
        this.World = new World(this);
        this.Player = new Player(this, document.querySelector('input[name="input"]:checked'));
        this.Virus = new Virus(this);

        // Game tick
        setInterval(() => this._tick(), 1000 / this.tps);
    }

    /**
     * Game tick
     * Originally designed for whole game, but now
     * only keyboard handler is inside tick
     */
    _tick() {
        this.Player.keyboardTick();
    }

    addScore() {
        this._Audio.play(this._Audio.tracks.success);
        this.Player.setScore(1);
    }

    deleteScore() {
        this._Audio.play(this._Audio.tracks.fail);
        this.Player.setScore(-1);

        this.World.inceraseDeadZone();
    }

    gameOver() {
        console.log("GAME OVER");
        this.gameState = "GAMEOVER";
        this.World.toggleGameOver(true);
        this.Virus.toggleSpawning(false);
        this.Player.toggleNewGameButton(true);
        this.Player.toggleResetGameButton(false);
    }

    newGame() {
        console.log("NEW GAME");
        this.gameState = "RUNNING";
        this.World.toggleGameOver(false);
        this.World.resetDeadZone();
        this.Player.resetScore();
        this.Virus.toggleSpawning(true);
        this.Player.toggleNewGameButton(false);
        this.Player.toggleStopGameButton(true);
        this.Player.toggleResetGameButton(true);
    }

    gameOver() {
        console.log("GAME OVER");
        this.gameState = "GAMEOVER";
        if (this.Player.score > localStorage.getItem('highScore'))
            localStorage.setItem('highScore', this.Player.score);
        this.World.toggleGameOver(true);
        this.Virus.toggleSpawning(false);
        this.Player.toggleNewGameButton(true);
        this.Player.toggleStopGameButton(false);
        this.Player.toggleResetGameButton(false);
    }

    resetGame() {
        console.log("RESTART GAME");
        this.Virus.toggleSpawning(false);
        this.World.resetDeadZone();
        this.Player.resetScore();
        this.Virus.toggleSpawning(true);
    }
}

/**
 * Input and score handler
 */
class Player {
    _scoreElem = document.getElementById('score');
    _eliminatedElem = document.getElementById('eliminated');
    _missedElem = document.getElementById('missed');
    _buttonNewGameElem = document.getElementById('button_newGame');
    _buttonResetGameElem = document.getElementById('button_resetGame');
    _buttonStopGameElem = document.getElementById('button_stopGame');

    // Debug
    _debugElem = document.getElementById("debug");
    _debugDotElem = document.getElementById('debugDot');

    keyboardSpeed = 10;

    cursorPosition = {
        x: 0,
        y: 0
    }

    score = 0;
    eliminated = 0;
    missed = 0;

    maxMissed = 3;

    _pressedKeys = {};

    constructor(game, radioElem) {
        // Reference to Game controller
        this._Game = game;


        if (this._Game.debug)
            this._debugElem.style.display = "block"

        this.changeInput(radioElem);

        // Start listening to input events
        this._listenToEvents();
    }

    toggleNewGameButton(visible) {
        this._buttonNewGameElem.disabled = !visible;
    }

    toggleResetGameButton(visible) {
        this._buttonResetGameElem.disabled = !visible;
    }

    toggleStopGameButton(visible) {
        this._buttonStopGameElem.disabled = !visible;
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

        this._buttonNewGameElem.addEventListener("click", e => {
            if (this._Game.gameState === "GAMEOVER")
                this._Game.newGame();
        });

        this._buttonResetGameElem.addEventListener("click", e => {
            if (this._Game.gameState === "RUNNING")
                this._Game.resetGame();
        });

        this._buttonStopGameElem.addEventListener("click", e => {
            if (this._Game.gameState === "RUNNING")
                this._Game.gameOver();
        });

        window.addEventListener("resize", this._debounceResize(() => {
            this._Game.World.onWindowResize();
        }));

        /**
         * Why not just listen on 'this._Game.World.canvas'?
         * Answer: Because I like sliding around corners!
         */
        document.addEventListener("mousemove", e => {
            if (this.radio_input !== 'mouse')
                return;

            if (this._Game.debug) {
                this._debugDotElem.style.top = (e.clientY - 2) + "px";
                this._debugDotElem.style.left = (e.clientX - 2) + "px";
            }

            this._Game.World.moveTarget(e.clientX, e.clientY);
            this.cursorPosition = { x: e.clientX, y: e.clientY }
        });

        this._Game.World.canvas.addEventListener("click", e => {
            const parent = e.target.parentElement;
            if (parent.className == 'virus') {
                console.log("Clicked on virus ID:", parent.id);
                this._Game.Virus.onClick(parent.id);
            }
        });

        document.addEventListener("keydown", e => {
            if (this.radio_input !== 'keyboard')
                return;
            this._pressedKeys[event.key] = true;

            if (event.keyCode === 32)
                document.elementFromPoint(this.cursorPosition.x, this.cursorPosition.y).click();
        });

        document.addEventListener("keyup", e => {
            delete this._pressedKeys[event.key];
        });
    }

    /**
     * Used to prevent lag on window resize event.
     * https://stackoverflow.com/questions/45905160/javascript-on-window-resize-end
     */
    _debounceResize(f) {
        let timer;
        return e => {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(f, 50, e);
        };
    }

    keyboardTick() {
        if (!Object.keys(this._pressedKeys).length)
            return;

        if (this._pressedKeys["w"] && this.cursorPosition.y - this.keyboardSpeed > this._Game.World.canvasBoundary.minY + this._Game.World.targetDimension.center.y)
            this.cursorPosition.y -= this.keyboardSpeed;
        if (this._pressedKeys["s"] && this.cursorPosition.y + this.keyboardSpeed < this._Game.World.canvasBoundary.maxY - this._Game.World.targetDimension.center.y)
            this.cursorPosition.y += this.keyboardSpeed;
        if (this._pressedKeys["a"] && this.cursorPosition.x - this.keyboardSpeed > this._Game.World.canvasBoundary.minX + this._Game.World.targetDimension.center.x)
            this.cursorPosition.x -= this.keyboardSpeed;
        if (this._pressedKeys["d"] && this.cursorPosition.x + this.keyboardSpeed < this._Game.World.canvasBoundary.maxX - this._Game.World.targetDimension.center.x)
            this.cursorPosition.x += this.keyboardSpeed;

        if (this._Game.debug) {
            this._debugDotElem.style.top = (this.cursorPosition.y - 2) + "px";
            this._debugDotElem.style.left = (this.cursorPosition.x - 2) + "px";
        }

        this._Game.World.moveTarget(this.cursorPosition.x, this.cursorPosition.y);
    }
}

class Virus {
    _parentElem = document.getElementById('virusses');
    _virusElem = document.createElement("div");

    _currentId = 0;
    _list = {};

    virusDimension = {
        width: 46 + 2,
        height: 75 + 1,
    }

    _spawningEnabled = false;

    _spawnRate = 2000;
    hideSpeed = 1000;

    _spawnerTimer = null;

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
        this._spawnRate -= 10;
        this._spawnerTimer = setTimeout(() => {
            const x = randomNumber(0, this._Game.World.canvasDimension.width - this.virusDimension.width);
            const y = randomNumber(0, this._Game.World.canvasDimension.height - this.virusDimension.height);
            this.spawn(x, y);
            this._spawner();
        }, this._spawnRate);
    }

    toggleSpawning(enable) {
        this._spawningEnabled = enable;
        console.log("Virus spawning:", enable ? "enabled" : "disabled");
        if (this._spawningEnabled)
            this._spawner();
        else {
            for (let key in this._list) {
                this._list[key].remove();
                delete this._list[key];
            }
            clearTimeout(this._spawnerTimer);
        }
    }

    spawn(x, y) {
        const virusElem = this._virusElem.cloneNode(true);
        virusElem.style.left = x + "px";
        virusElem.style.top = y + "px";
        virusElem.id = this._currentId++;
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
        }, this.hideSpeed);
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
    canvas = document.getElementById('canvas');

    _target = document.getElementById('target');

    _canvasOffset = {
        x: 0,
        y: 0
    }

    // DeadZone
    _deadZoneElem = document.getElementById("deadZone");
    deadZoneWidth = 870;

    // GameOver
    _gameOverElem = document.getElementById("gameOver");
    _highScoreElem = document.getElementById("highScore");
    _newRecordElem = document.getElementById("newRecord");

    constructor() {
        // Reference to Game controller
        this._Game = game;

        this._target.style.display = "block";
        this._targetRect = this._target.getBoundingClientRect();
        this.onWindowResize();

        this._canvasRect = this.canvas.getBoundingClientRect();
        this.canvasDimension = {
            width: this._canvasRect.width,
            height: this._canvasRect.height,
        }
        this.canvasBoundary = {
            minX: this._canvasOffset.x,
            minY: this._canvasOffset.y,
            maxX: this._canvasRect.width + this._canvasOffset.x,
            maxY: this._canvasRect.height + this._canvasOffset.y
        }
    }

    moveTarget(x, y) {
        // Compensate canvas offset and target size
        x -= this._canvasOffset.x + this.targetDimension.center.x;
        y -= this._canvasOffset.y + this.targetDimension.center.y;

        // Block escaping from canvas
        x = (x > 0 ? (x < this._canvasRect.width - this.targetDimension.width ? x : this._canvasRect.width - this.targetDimension.width) : 0)
        y = (y > 0 ? (y < this._canvasRect.height - this.targetDimension.height ? y : this._canvasRect.height - this.targetDimension.height) : 0)

        this._target.style.left = x + "px";
        this._target.style.top = y + "px";
    }

    resetDeadZone() {
        this.deadZoneWidth = 0;
        this._setDeadZone();
    }

    inceraseDeadZone(count = 10) {

        if (this.deadZoneWidth + count >= this._canvasRect.width) {
            this.deadZoneWidth = this._canvasRect.width + 1;
            this._Game.gameOver();
        } else
            this.deadZoneWidth += count
        this._setDeadZone();
    }

    _setDeadZone() {
        this._deadZoneElem.style.right = (this._canvasRect.width - this.deadZoneWidth) + "px";
        this._deadZoneElem.style.display = this.deadZoneWidth > 0 ? "block" : "none";

    }

    toggleGameOver(visible) {
        const highScore = localStorage.getItem('highScore');
        this._highScoreElem.innerHTML = highScore;
        this._gameOverElem.style.display = !visible ? "none" : "flex";
        this._newRecordElem.style.display = highScore > this._Game.Player.score ? "none" : "block";
    }

    /**
     * Called on window resize (if not resized for more than 50ms to avoid lag)
     */
    onWindowResize() {
        this._canvasOffset = {
            x: this.canvas.offsetLeft,
            y: this.canvas.offsetTop
        }
        this.targetDimension = {
            width: this._targetRect.width,
            height: this._targetRect.height,
            center: {
                x: Math.floor(this._targetRect.width / 2) + 1,
                y: Math.floor(this._targetRect.width / 2) + 1
            }
        }
        console.log("Window resized! New canvas offset:", this._canvasOffset);
    }
}

const game = new Game(debug);