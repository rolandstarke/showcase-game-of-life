
class GameOfLife {
    constructor() {
        /**
         * @type {LivingCell[]}
         */
        this.livingCells = [];
        this.generation = 1;
    }

    calcCellInfo() {
        const cells = {};
        this.livingCells.forEach((livingCell) => {
            for (let xOffset = - 1; xOffset <= 1; xOffset++) {
                for (let yOffset = -1; yOffset <= 1; yOffset++) {
                    const x = xOffset + livingCell.x;
                    const y = yOffset + livingCell.y;
                    cells[x] = cells[x] || {};
                    cells[x][y] = cells[x][y] || new CellInfo(x, y);

                    if (xOffset === 0 && yOffset === 0) {
                        cells[x][y].livingCell = livingCell;
                    } else {
                        cells[x][y].livingNeighbors.push(livingCell);
                    }

                }
            }
        });
        return cells;
    }

    calcNextGeneration() {
        const livingCells = [];
        const cells = this.calcCellInfo();
        for (let x in cells) {
            for (let y in cells[x]) {
                /**
                 * @type {CellInfo}
                 */
                const cell = cells[x][y];
                if (cell.livingCell) {
                    if (cell.livingNeighbors.length === 2 || cell.livingNeighbors.length === 3) {
                        //cell survives
                        livingCells.push(cell.livingCell);
                    } else {
                        //cell dies
                    }
                } else {
                    if (cell.livingNeighbors.length === 3) {
                        //new cell is born

                        //for some more fun lets pass colors from a parent to the new born
                        let parent;
                        if (cell.livingNeighbors[0].color === cell.livingNeighbors[1].color) {
                            parent = cell.livingNeighbors[0];
                        } else if (cell.livingNeighbors[0].color === cell.livingNeighbors[2].color) {
                            parent = cell.livingNeighbors[0];
                        } else if (cell.livingNeighbors[1].color === cell.livingNeighbors[2].color) {
                            parent = cell.livingNeighbors[1];
                        }
                        parent = cell.livingNeighbors[Math.floor(cell.livingNeighbors.length * Math.random())];

                        livingCells.push(new LivingCell(x, y, parent.color));
                    }
                }
            }
        }
        this.generation++;
        this.livingCells = livingCells;
    }
}

class LivingCell {
    constructor(x, y, color) {
        this.x = +x;
        this.y = +y;
        this.color = color;
    }
}

class CellInfo {
    constructor(x, y) {
        this.x = +x;
        this.y = +y;
        this.livingNeighbors = [];
        this.livingCell = null;
    }
}

class Visualizer {
    constructor(canvas, gameOfLife) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.offset = { x: 0, y: 0 };
        this.zoom = 3;
        this.gameOfLife = gameOfLife;
        this.mouseCellMark = null;
    }

    draw() {
        var leftTopCorner = this.getCellCoordinatesFromMousePosition({ x: 0, y: 0 });
        var rightBottomCorner = this.getCellCoordinatesFromMousePosition({ x: this.canvas.width, y: this.canvas.height });
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const zoom = Visualizer.ZOOM_LEVELS[this.zoom];

        this.gameOfLife.livingCells.forEach(livingCell => {
            if (livingCell.x >= leftTopCorner.x
                && livingCell.x <= rightBottomCorner.x
                && livingCell.y >= leftTopCorner.y
                && livingCell.y <= rightBottomCorner.y
            ) {
                this.ctx.fillStyle = livingCell.color;
                this.ctx.fillRect(
                    livingCell.x * zoom.boxSize + this.offset.x,
                    livingCell.y * zoom.boxSize + this.offset.y,
                    zoom.sideLength,
                    zoom.sideLength
                );
            }
        });

        if (this.mouseCellMark) {
            this.ctx.fillStyle = this.mouseCellMark.fillStyle;
            this.ctx.fillRect(
                this.mouseCellMark.x * zoom.boxSize + this.offset.x,
                this.mouseCellMark.y * zoom.boxSize + this.offset.y,
                zoom.sideLength,
                zoom.sideLength
            );
        }
    }

    changeZoom(diff, mousePosition) {
        const oldZoom = this.zoom;
        let newZoom = oldZoom + diff;
        if (newZoom < 0) {
            newZoom = 0;
        } else if (newZoom > Visualizer.ZOOM_LEVELS.length - 1) {
            newZoom = Visualizer.ZOOM_LEVELS.length - 1;
        }
        this.zoom = newZoom;

        if (mousePosition && oldZoom !== newZoom) {
            const centerBefore = {
                x: (mousePosition.x - this.offset.x) / Visualizer.ZOOM_LEVELS[oldZoom].boxSize,
                y: (mousePosition.y - this.offset.y) / Visualizer.ZOOM_LEVELS[oldZoom].boxSize
            };
            const centerAfter = {
                x: (mousePosition.x - this.offset.x) / Visualizer.ZOOM_LEVELS[newZoom].boxSize,
                y: (mousePosition.y - this.offset.y) / Visualizer.ZOOM_LEVELS[newZoom].boxSize
            };

            this.offset.x += Math.round((centerAfter.x - centerBefore.x) * Visualizer.ZOOM_LEVELS[newZoom].boxSize);
            this.offset.y += Math.round((centerAfter.y - centerBefore.y) * Visualizer.ZOOM_LEVELS[newZoom].boxSize);

        }
    }

    getCellCoordinatesFromMousePosition(mousePosition) {
        const zoom = Visualizer.ZOOM_LEVELS[this.zoom];
        const halfBorderSize = (zoom.boxSize - zoom.sideLength) / 2;
        return {
            x: Math.floor((mousePosition.x - this.offset.x + halfBorderSize) / zoom.boxSize),
            y: Math.floor((mousePosition.y - this.offset.y + halfBorderSize) / zoom.boxSize),
        }

    }

    markMouseCell(mousePosition, color) {
        if (!mousePosition || !color) {
            this.mouseCellMark = false;
        } else {
            this.mouseCellMark = this.getCellCoordinatesFromMousePosition(mousePosition);
            this.mouseCellMark.fillStyle = color;
        }

    }

    resize(width, height) {
        //keep center
        this.offset.x += Math.round((width - this.canvas.width) / 2);
        this.offset.y += Math.round((height - this.canvas.height) / 2);
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

Visualizer.ZOOM_LEVELS = [
    { sideLength: 2, boxSize: 3 },
    { sideLength: 3, boxSize: 4 },
    { sideLength: 4, boxSize: 6 },
    { sideLength: 5, boxSize: 7 },
    { sideLength: 6, boxSize: 9 },
    { sideLength: 8, boxSize: 12 },
    { sideLength: 11, boxSize: 15 },
    { sideLength: 15, boxSize: 19 },
    { sideLength: 20, boxSize: 25 },
];






const canvas = document.querySelector('#canvas');

const gameOfLife = new GameOfLife();
const visualizer = new Visualizer(canvas, gameOfLife);
visualizer.resize(window.innerWidth, window.innerHeight);


//prefill the game with some living cells
const prefillers = [
    function allRandom() {
        for (var x = -20; x < 20; x++) {
            for (var y = -20; y < 20; y++) {
                if (Math.random() > 0.7) {
                    gameOfLife.livingCells.push(new LivingCell(x, y, getRandomColor()));
                }
            }
        };
    },
    function verticalLines() {
        const additionalSize = Math.floor(Math.random() * 10);
        for (var x = -40; x < 40; x += 2) {
            if (Math.random() > 0.2) {
                for (var y = -20 - additionalSize; y < 20 + additionalSize * 2; y++) {
                    gameOfLife.livingCells.push(new LivingCell(x, y, getRandomColor()));
                }
            }
        };
    },

    function sqares() {
        let x = 0;
        let y = 0;
        let directionX = 1;
        let directionY = 0;
        const start = Math.floor((Math.random() * 20)) * 2 + 2;
        const increase = Math.floor((Math.random() * 20)) * 2 + 2;
        for (let n = start; n < 80; n += 16) {
            x = -n / 2
            y = -n / 2;
            const color = getRandomColor();
            for (let k = 0; k < 4; k++) {
                for (let i = 0; i < n; i++) {
                    x += directionX;
                    y += directionY;
                    gameOfLife.livingCells.push(new LivingCell(x, y, color));
                }

                if (directionX === 1) {
                    directionX = 0;
                    directionY = 1;
                } else if (directionY === 1) {
                    directionX = -1;
                    directionY = 0;
                } else if (directionX === -1) {
                    directionX = 0;
                    directionY = -1;
                } else if (directionY === -1) {
                    directionX = 1;
                    directionY = 0;
                }
            }
        }



    }
];
prefillers[Math.floor(prefillers.length * Math.random())]();



(function drawLoop() {
    window.stats && stats.begin();
    visualizer.draw();
    window.stats && stats.end();
    requestAnimationFrame(drawLoop);
})();

let updateLoopTimeout;
let lastExecution = Date.now();
let isDrawing = false;
function updateLoop() {
    if (!isDrawing) { //don't update while setting cells they will emediadly disapear
        gameOfLife.calcNextGeneration();
    }
    clearTimeout(updateLoopTimeout);
    updateLoopTimeout = setTimeout(
        updateLoop,
        Math.max(16 - (Date.now() - lastExecution), 0) // limit to 60 executions per second
    );
    lastExecution = Date.now();
}
updateLoop();


canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('touchstart', handlePointerDown);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('touchmove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);
window.addEventListener('touchend', handlePointerUp);

let mouseDown = null;
let mousePosition;
let lastDistanceDown;
let visualizerOffset = JSON.parse(JSON.stringify(visualizer.offset));
function handlePointerDown(e) {
    if (e.touches && e.touches.length === 2) {
        //zoom mobile
        lastDistanceDown = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        return;
    }

    mouseDown = getPointerPosition(e);
    visualizerOffset = JSON.parse(JSON.stringify(visualizer.offset));

    if (getCurrenltySelectedColor()) {
        isDrawing = true;
    }
}

let mouseMoveTimeout;
function handlePointerMove(e) {
    if (e.touches && e.touches.length === 2) {
        //zoom mobile
        const dinstance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        if (Math.abs(lastDistanceDown - dinstance) > 30) {
            visualizer.changeZoom(-Math.sign(lastDistanceDown - dinstance), {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            });
            lastDistanceDown = dinstance;
        }
        return;
    }

    document.body.classList.add('active--mouse');
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
        document.body.classList.remove('active--mouse');
    }, 2000);

    mousePosition = getPointerPosition(e);

    if (isDrawing) {
        //its so slow clicking for every cell, its more fun if you can leave the mouse pressed
        addCellsFromEvent(e);
        return;
    }


    if (mousePosition && e.target === canvas) {
        visualizer.markMouseCell(mousePosition, getCurrenltySelectedColor());
    } else {
        visualizer.markMouseCell(null);
    }
    if (mouseDown) {
        visualizer.offset.x = Math.round(visualizerOffset.x + (mousePosition.x - mouseDown.x));
        visualizer.offset.y = Math.round(visualizerOffset.y + (mousePosition.y - mouseDown.y));
    }

}

function handlePointerUp(e) {
    mouseDown = null;
    lastDistanceDown = null;
    isDrawing = false;
}

function getPointerPosition(e) {
    if (e.clientX || e.clientY) {
        return { x: e.clientX, y: e.clientY };
    }
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
}

function getCurrenltySelectedColor() {
    const element = document.querySelector('.color.toolbar__button--selected');
    if (element) {
        return element.style.backgroundColor;
    }
};

function getRandomColor() {
    return 'rgb(' + [Math.floor(Math.random() * 200), Math.floor(Math.random() * 200), Math.floor(Math.random() * 200)].join(',') + ')';
}

function addCellsFromEvent(e) {
    const mousePosition = getPointerPosition(e);
    //its so slow clicking for every cell, its more fun if you can leave the mouse pressed
    const currentColor = getCurrenltySelectedColor();
    if (mousePosition && currentColor) {
        const pos = visualizer.getCellCoordinatesFromMousePosition(mousePosition);
        const existingCellAtThisPosition = gameOfLife.livingCells
            .findIndex(cell => cell.x === pos.x && cell.y === pos.y);
        if (existingCellAtThisPosition >= 0) {
            gameOfLife.livingCells.splice(existingCellAtThisPosition, 1);
        }
        console.log(currentColor);
        if (currentColor === document.querySelector('.color--delete').style.backgroundColor) {
            return; //white is delete
        }
        gameOfLife.livingCells.push(new LivingCell(pos.x, pos.y, currentColor));
    }
}


window.addEventListener('wheel', e => {
    visualizer.changeZoom(-Math.sign(e.deltaY), mousePosition);
});

window.addEventListener('resize', e => {
    visualizer.resize(window.innerWidth, window.innerHeight);
});


document.querySelector('.toolbar').addEventListener('click', e => {
    if (e.target.classList.contains('color')) {
        const previousSelected = document.querySelector('.toolbar__button--selected');
        if (previousSelected) {
            previousSelected.classList.remove('toolbar__button--selected');
        }
        if (previousSelected === e.target) {
            return;
        }
        e.target.classList.add('toolbar__button--selected');
    }
});

document.querySelector('.play').addEventListener('click', e => {
    const previousSelected = document.querySelector('.toolbar__button--selected');
    if (previousSelected) {
        previousSelected.classList.remove('toolbar__button--selected');
    }
    document.querySelector('.toolbar').classList.remove('paused');
    document.querySelector('.pause').classList.add('toolbar__button--selected');
    updateLoop();
});

document.querySelector('.pause').addEventListener('click', e => {
    const previousSelected = document.querySelector('.toolbar__button--selected');
    if (previousSelected) {
        previousSelected.classList.remove('toolbar__button--selected');
    }
    document.querySelector('.toolbar').classList.add('paused');
    document.querySelector('.play').classList.add('toolbar__button--selected');
    clearTimeout(updateLoopTimeout);
});

document.querySelector('.trash').addEventListener('click', e => {
    const previousSelected = document.querySelector('.toolbar__button--selected');
    if (previousSelected) {
        previousSelected.classList.remove('toolbar__button--selected');
    }
    document.querySelector('.toolbar').classList.add('paused');
    document.querySelector('.play').classList.add('toolbar__button--selected');
    clearTimeout(updateLoopTimeout);
    gameOfLife.livingCells = [];
    gameOfLife.generation = 1;
});



canvas.addEventListener('click', e => {
    addCellsFromEvent(e);
});


window.stats = new Stats();
document.body.appendChild(stats.dom);
stats.dom.style.display = 'none';

window.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (stats.dom.style.display === 'none') {
        stats.dom.style.display = '';
    } else {
        stats.dom.style.display = 'none';
    }
});