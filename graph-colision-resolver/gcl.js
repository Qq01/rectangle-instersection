const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
canvas.style.width = canvas.width + 'px';
canvas.style.height = canvas.height + 'px';
canvas.style.border = '1px solid black';
document.body.appendChild(canvas);
/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d');

let cameraX = 0;
let cameraY = 0;
canvas.addEventListener('mousemove', function(e) {
    if (e.buttons == 1) {
        cameraX += e.movementX;
        cameraY += e.movementY;
    }
});

let  elements = [];
const debugElements = {
    center: (_=>{const center = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        draw: function() {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.ellipse(cameraX + center.x, cameraY + center.y, 10, 10, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    };return center})()
};
function scale(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function createRectangle(x, y, width, height, color) {
    const rect = {x, y, width, height, color};
    rect.draw = function() {
        ctx.fillStyle = rect.color;
        ctx.fillRect(cameraX + rect.x, cameraY + rect.y, rect.width, rect.height);
    }
    return rect;
}
function randomColor() {
    let r = Math.round(scale(Math.random(), 0, 1, 50, 200));
    let g = Math.round(scale(Math.random(), 0, 1, 50, 200));
    let b = Math.round(scale(Math.random(), 0, 1, 50, 200));
    return `rgb(${r}, ${g}, ${b})`;
}
function generateElementsSet(size = 1000) {
    elements = [];
    for (let i = 0; i < size; i++) {
        let width = Math.round(scale(Math.random(), 0, 1, 100, 200));
        let height = Math.round(scale(Math.random(), 0, 1, 100, 200));
        let x = Math.round(scale(Math.random(), 0, 1, 0, canvas.width - width));
        let y = Math.round(scale(Math.random(), 0, 1, 0, canvas.height - height));
        let color = randomColor();
        elements.push(createRectangle(x, y, width, height, color));
    }
}
const inputSetSize = document.createElement('input');
document.body.appendChild(inputSetSize);
inputSetSize.type = 'number';
inputSetSize.min = 10;
inputSetSize.max = 10000;
inputSetSize.value = 1000;
const btnGenerateElementSet = document.createElement('button');
btnGenerateElementSet.innerHTML = 'Generate Elements';
btnGenerateElementSet.addEventListener('click', e => {generateElementsSet(inputSetSize.valueAsNumber)});
document.body.appendChild(btnGenerateElementSet);
generateElementsSet();

function vectorLength(x, y) {
    return Math.sqrt(x * x + y * y);
}

function displace(toDisplace, collider, vector) {
    let displaced = false;
    const rect1 = toDisplace;
    const rect2 = collider;
    let x1 = rect1.x + rect1.width - rect2.x;
    let x2 = rect2.x + rect2.width - rect1.x;
    let y1 = rect1.y + rect1.height - rect2.y;
    let y2 = rect2.y + rect2.height - rect1.y;
    const magnitude = 10;
    if (x1 > 0 && x2 > 0 && y1 > 0 && y2 > 0) {
        toDisplace.x += vector.x * magnitude;
        toDisplace.y += vector.y * magnitude;
        displace(toDisplace, collider, vector);
        displaced = true;
    }
    return displaced;
}

function resolveIntersections() {
    let time = performance.now();
    const references = [];
    let lowX = Infinity, lowY = Infinity, highX = -Infinity, highY = -Infinity;
    for (let node of elements) {
        let reference = {
            node,
            length: vectorLength(node.x, node.y)
        }
        if (lowX > node.x) {
            lowX = node.x;
        }
        if (highX < node.x) {
            highX = node.x;
        }
        if (lowY > node.y) {
            lowY = node.y;
        }
        if (highY < node.y) {
            highY = node.y;
        }
        references.push(reference);
    }
    let centerX = ((highX - lowX) / 2) + lowX;
    let centerY = ((highY - lowY) / 2) + lowY;
    debugElements.center.x = centerX;
    debugElements.center.y = centerY;
    function distance(pos1, pos2) {
        let x = Math.abs(pos1.x - pos2.x);
        let y = Math.abs(pos1.y - pos2.y);
        let d = Math.sqrt(x * x + y * y);
        return d;
    }
    const sortedFromCenter = [...references].sort(function(ref1, ref2) {
        return distance({x: ref1.node.x, y: ref1.node.t}, {x: centerX, y: centerY}) - distance({x: ref2.node.x, y: ref2.node.t}, {x: centerX, y: centerY});
    });
    function normalize({x, y}) {
        let a = Math.sqrt((x * x) + (y * y));
        let u = {x: x / a, y: y / a};
        return u;
    }
    function direction(pos1, pos2) {
        let x = pos2.x - pos1.x;
        let y = pos2.y - pos1.y;
        return normalize({x, y});
    }
    for (let i = 1; i < sortedFromCenter.length; i++) {
        let toDisplace = sortedFromCenter[i].node;
        let displaced = false;
        do {
            displaced = false;
            for (let j = 0; j < i; j++) {
                let collider = sortedFromCenter[j].node;
                let vector = direction({x: centerX, y: centerY}, {x: toDisplace.x + toDisplace.width / 2, y: toDisplace.y + toDisplace.height / 2});
                if (displace(toDisplace, collider, vector)) {
                    displaced = true;
                }
            }
        } while (displaced);
    }
    console.log('time: ', performance.now() - time);
    // const sortedByLength = [...references].sort(function(ref1, ref2) {
    //     return ref1.length - ref2.length;
    // });
    // let centerIndex = Math.round(sortedByLength.length / 2) - 1;
    // let centerNode = sortedByLength[centerIndex];
}
const btnResolveIntersections = document.createElement('button');
btnResolveIntersections.innerHTML = 'Resolve Intersections';
btnResolveIntersections.addEventListener('click', e => {resolveIntersections()});
document.body.appendChild(btnResolveIntersections);

//LOOP/////////////////////////////////////////////////
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let node of elements) {
        node.draw();
    }
    for (let name in debugElements){
        debugElements[name].draw();
    }
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.strokeText(`x: ${cameraX}, y: ${cameraY}`, 20, 20);
    ctx.fillText(`x: ${cameraX}, y: ${cameraY}`, 20, 20);
    
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
