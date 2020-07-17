const Direction= {
    NONE: 0, BOTTOM: 1, LEFT: 2, RIGHT: 3,
    TURN_LEFT: 4, TURN_RIGHT: 5
};
const LoopStatus= {
    NORMAL: 0, PAUSE: 1, GAMEOVER: 2, START: 3
};
const Musics= {
    BACKGROUND: document.getElementById("backgroundMusic"),
    BREAK: document.getElementById("break"),
    GAMEOVER: document.getElementById("gameover")
};
const SIZE= 30;
const NB_CASES_X= 12;
const NB_CASES_Y= 20;
const SIZE_X= SIZE*NB_CASES_X;
const SIZE_Y= SIZE*NB_CASES_Y;
const START_INTERVAL= 280;
const ELT_GAME_WINDOWS= document.getElementById("gameWindows");
const ELT_CONTAINER= document.getElementById("container");
const ELT_RIGHT= document.getElementById("right");
const ELT_CANVAS_SECTION= document.getElementById("canvasSection");
const ELTS_CANVAS_NEXT= document.getElementsByClassName("nextBlocks");
ELT_GAME_WINDOWS.height= SIZE_Y;
ELT_GAME_WINDOWS.width= SIZE_X;

for (let i = 0; i < ELTS_CANVAS_NEXT.length; i++) {
    ELTS_CANVAS_NEXT[i].height= SIZE*4;
    ELTS_CANVAS_NEXT[i].width= SIZE*4;
}

//initalisation du tableau 2d
//contient l'état de tout les carrés déposés
//et sert pour les tests de collisions et l'affichage
let casesBlocks= []; 
for(let x= 0 ; x < NB_CASES_X ; x++){
    casesBlocks[x]= [];
    for(let y= 0 ; y < NB_CASES_Y+5 ; y++){
        casesBlocks[x][y]= {value: false, color: 0};
    }
}
let gradients= [];
let loop= LoopStatus.START;
let currentBlock= [];
let nextBlocks= [];
let rowsFull= [];
let interval= START_INTERVAL;
let oldTime= Date.now();
let lastLoopTime;
let duration= 0;
let score= 0;
let completedRows= 0;
let lsInput= [];
let keySpace= false;
let isTouchScreen= false;
let YTouch;



initTouch()
init();

function init(){
    document.addEventListener("keydown", inputRegistation);

    loadGradients();
    for (let i = 0; i < 3; i++) {
        nextBlocks[i]= newBlock();
    }
    currentBlock= setNewPosition(newBlock());
    displayNextBlocksCanvas();
    displayGameCanvas();
    
    lastLoopTime= Date.now();
    GameLoop();
}

function GameLoop(){
    if(loop !== LoopStatus.NORMAL){
        inputManagement();
        setTimeout(GameLoop, 50);
        return 0;
    }
    let direction;
    let state;

    let dTime= Date.now()-lastLoopTime;
    if(dTime > 50){
        duration+= dTime;
        lastLoopTime= Date.now();
        displayTime();
    }
    
    if(Date.now() >= oldTime+interval){
        oldTime= Date.now();
        direction= Direction.BOTTOM;
    }
    else{
        direction= inputManagement();
    }
    if(direction){
        state= controlPosition(direction);
        if(state){
            if(loop === LoopStatus.GAMEOVER){
                Musics.BACKGROUND.pause();
                Musics.BACKGROUND.currentTime= 0;
                Musics.GAMEOVER.play();
                GameLoop();
            }
            else if(direction === Direction.BOTTOM){
                updatePositions(state);
                displayScore();
                nextBlocks.push(newBlock());
                currentBlock= setNewPosition(nextBlocks.shift());
                displayNextBlocksCanvas();
                keySpace= false;
            }
        }else updatePositions(state, direction);
        displayGameCanvas();
    }
    requestAnimationFrame(GameLoop);
}

function displayGameCanvas(){
    const ctx = ELT_GAME_WINDOWS.getContext("2d");
    ctx.clearRect(0, 0, ELT_GAME_WINDOWS.width, ELT_GAME_WINDOWS.height);

    for(let y= 0 ; y < NB_CASES_Y ; y++){
        for(let x= 0 ; x < NB_CASES_X ; x++){
            if(casesBlocks[x][y].value){
                let positionY= (y*-1)+(NB_CASES_Y-1);  //inversion de la position en y car canvas commence en haut
                ctx.drawImage(gradients[casesBlocks[x][y].color], x*SIZE, positionY*SIZE, SIZE, SIZE);
            }
        }
    }

    //affichage currentBlock
    for (let i= 0 ; i < currentBlock.pos.length ; i++) {
        let positionY= (currentBlock.pos[i].y*-1)+(NB_CASES_Y-1);
        ctx.drawImage(gradients[currentBlock.color], currentBlock.pos[i].x*SIZE, positionY*SIZE, SIZE, SIZE);
    }

     //affichage text
    let text;
    if(isTouchScreen) text= "Touchez ";
    else text= "Appuyez sur ENTER ";
   
    if(loop === LoopStatus.GAMEOVER){
        displayMsg(ctx, "Game Over", text+"pour recommencer");
    }
    else if(loop === LoopStatus.PAUSE){
        displayMsg(ctx, "PAUSE", text+"pour reprendre");
    }
    else if(loop === LoopStatus.START){
        displayMsg(ctx, "TETRIS", text+"pour commencer");
    }
}

function displayMsg(ctx, title, content){
    ctx.fillStyle= "rgba(125, 125, 125, 0.5)";
    ctx.fillRect(0, 0, SIZE_X, SIZE_Y);

    ctx.fillStyle= "rgb(50, 50, 50)";
    ctx.font = "70px sans-serif";
    ctx.fillText(title, SIZE_X*20/100, SIZE_Y*3/10, SIZE_X*60/100);

    ctx.fillStyle= "rgb(10, 10, 10)";
    ctx.font = "25px sans-serif";
    ctx.fillText(content, SIZE_X*10/100, SIZE_Y/2, SIZE_X*80/100);
}

function displayNextBlocksCanvas(){
    for (let i= 0 ; i < nextBlocks.length ; i++){
        let canvas= ELTS_CANVAS_NEXT[i];
        let block= nextBlocks[i];
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i= 0 ; i < block.pos.length ; i++) {
            let positionY= (block.pos[i].y*-1)+3;  //inversion de la position en y car canvas commence en haut
            ctx.drawImage(gradients[block.color], block.pos[i].x*SIZE, positionY*SIZE, SIZE, SIZE);
        }
    }
}

function displayScore(){
    document.getElementById("score").textContent= score;
    document.getElementById("rows").textContent= completedRows;
}

function displayTime(){
    let h, m, s, ms, r, formatedTime= "";
    h= Math.floor(duration / 3600000);
    r= duration % 3600000;
    m= Math.floor(r / 60000);
    r= r % 60000;
    s= Math.floor(r / 1000);
    ms= r % 1000;
    if(h > 0) formatedTime= h + ":";
    if(h > 0 || m > 0){
        if(h > 0 && m < 10) m= "0"+m;
        formatedTime+= m + ":";
    }
    if((h > 0 || m > 0) && s < 10) s= "0" + s;
    if(ms < 100) ms= "0" + ms;
    else if(ms < 10) ms= "00" + ms;
    formatedTime+= s + ":" + ms;

    const ELT_TIME= document.getElementById("time");
    ELT_TIME.textContent= formatedTime;
    if(h) ELT_TIME.style.fontSize= "1.2rem";
    else if(m >= 10) ELT_TIME.style.fontSize= "2rem";
}
function fullBottom(){
    while (!controlPosition()) {
        updatePositions(false);
    }    
}
function controlPosition(direction= Direction.BOTTOM){
    /* retourne true en cas de collision,
    ajoute dans rowsFull les lignes pleines (coordonnés y)
    passe gameover à true le cas échéant*/
    let collision= false;
    rowsFull= [];

    if(direction === Direction.TURN_LEFT || direction === Direction.TURN_RIGHT){
        let newBlock= rotation(direction);

        for(let i= 0 ; i < newBlock.length; i++){
            let x= newBlock[i].x;
            let y= newBlock[i].y;
            if(x < 0 || x >= NB_CASES_X || casesBlocks[x][y].value){
                collision= true;
                break;
            } 
        }
    }

    else{
        for(let i= 0 ; i < currentBlock.pos.length; i++){
            let x= currentBlock.pos[i].x;
            let y= currentBlock.pos[i].y;
            if(direction === Direction.BOTTOM && y === 0 
            || direction === Direction.BOTTOM && casesBlocks[x][y-1].value
            || direction === Direction.LEFT && x-1 < 0
            || direction === Direction.LEFT && casesBlocks[x-1][y].value
            || direction === Direction.RIGHT && x+1 > NB_CASES_X-1
            || direction === Direction.RIGHT && casesBlocks[x+1][y].value){
                collision= true;
                break;
            }
        }
        
        if(direction === Direction.BOTTOM && collision){ 
            
            //test ligne complète
            for(let i= 0 ; i < currentBlock.pos.length ; i++){
                let isRowFull= true;
                for(let j= 0 ; j < NB_CASES_X ; j++){
                    if(!casesBlocks[j][currentBlock.pos[i].y].value
                    && !currentBlock.pos.some(el=>el.x === j && el.y === currentBlock.pos[i].y)){
                        isRowFull= false;
                        break;
                    }
                }
                if(isRowFull && !rowsFull.includes(currentBlock.pos[i].y)) rowsFull.push(currentBlock.pos[i].y);
            }

            //test game over
            for(let i= 0 ; i < currentBlock.pos.length ; i++){
                if(currentBlock.pos[i].y - rowsFull >= NB_CASES_Y){
                    loop= LoopStatus.GAMEOVER;
                    break;
                }
            }
        }
    }
    
    return collision;
}

function updateScore(rowsDestroyed){
    if(rowsDestroyed){
        score+= 5 * rowsDestroyed * rowsDestroyed * Math.ceil(START_INTERVAL+1 - interval);
        interval= START_INTERVAL - Math.floor(duration / 120000) * 10;
    }
}

function updatePositions(control, direction = Direction.BOTTOM){
    /*mise a jour de casesBlocks et currentBlock*/
    if(control && direction === Direction.BOTTOM){
        for(let i= 0 ; i < currentBlock.pos.length; i++){
            let x= currentBlock.pos[i].x;
            let y= currentBlock.pos[i].y;
            casesBlocks[x][y].value= true;
            casesBlocks[x][y].color= currentBlock.color;
        }

        if(rowsFull.length){ //suppression des lignes pleines
            Musics.BREAK.play();
            updateScore(rowsFull.length);
            completedRows+= rowsFull.length;
            rowsFull.sort((a, b) => (a-b)*-1); 
            for(let x= 0 ; x <  casesBlocks.length ; x++) {
                for(let j= 0 ; j < rowsFull.length ; j++) {
                    casesBlocks[x].splice(rowsFull[j], 1);
                    casesBlocks[x].push({value: 0, color: 0});
                }
            }
        }
    }

    else if(!control && direction !== Direction.NONE){
        if(direction === Direction.TURN_LEFT || direction === Direction.TURN_RIGHT){
            currentBlock.pos= rotation(direction);
        }
        else{
            for(let i= 0 ; i < currentBlock.pos.length; i++){
                if(direction === Direction.LEFT) currentBlock.pos[i].x--;
                else if(direction === Direction.RIGHT) currentBlock.pos[i].x++;
                else currentBlock.pos[i].y--; //bottom sans collision
            }
        }
    }
}

function inputRegistation(e){
    /*enregistrement des inputs*/
    const keysAlloyed= [13, 19, 37, 38, 39, 40, 65];
    if(keysAlloyed.includes(e.keyCode) && lsInput.length < 3){
        lsInput.push(e.keyCode);
        e.preventDefault();
    }
    else if(e.keyCode === 32){
        if(e.repeat && keySpace) lsInput.push(e.keyCode);
        else if(!e.repeat){
            lsInput.push(e.keyCode);
            keySpace= true;
        }
        e.preventDefault();
    }
}

function inputManagement(){
    /*gestion des inputs*/
    let direction= Direction.NONE;
    if(lsInput.length){
        switch (lsInput.shift()) {
            case 13:
                if(loop){
                    if(loop === LoopStatus.GAMEOVER){
                        reset();
                        init();
                    }
                    else{
                        lastLoopTime= Date.now();
                        loop= LoopStatus.NORMAL;
                    }
                    Musics.BACKGROUND.play();
                }
                break;
            case 19:
                if(!loop){
                    loop= LoopStatus.PAUSE;
                    displayGameCanvas();
                    Musics.BACKGROUND.pause();
                }
                break;
            case 32:
                direction= Direction.BOTTOM;
                break;
            case 32:
                direction= Direction.BOTTOM;
                break;
            case 37:
                direction= Direction.LEFT;
                break;
            case 38://top
                direction= Direction.TURN_RIGHT;
                break;
            case 39:
                direction= Direction.RIGHT;
                break;
            case 40:
                direction= Direction.TURN_LEFT;
                break;
            case 65:
                fullBottom();
                break;
            default:
                direction= Direction.NONE;
                break;
        }
    }
    return direction;
}

function rotation(direction = Direction.TURN_RIGHT){
    let newBlock= [];
    let form= [];
    let maxX= currentBlock.pos[0].x, maxY= currentBlock.pos[0].y, minX= currentBlock.pos[0].x, minY= currentBlock.pos[0].y;

    for(let i= 1 ; i < currentBlock.pos.length ; i++){
        if(currentBlock.pos[i].x > maxX) maxX= currentBlock.pos[i].x;
        else if(currentBlock.pos[i].x < minX) minX= currentBlock.pos[i].x;
        
        if(currentBlock.pos[i].y > maxY) maxY= currentBlock.pos[i].y;
        else if(currentBlock.pos[i].y < minY) minY= currentBlock.pos[i].y;
    }

    //on recupère le bloc avec 0 comme origine
    for(let i= 0 ; i < currentBlock.pos.length ; i++){
        form[i]= {};
        form[i].x= currentBlock.pos[i].x - minX;
        form[i].y= currentBlock.pos[i].y - minY;
    }

    //on applique la rotation selon le sens et on rajoute nin(x ou y) pour retrouver la position d'origine
    for(let i= 0 ; i < currentBlock.pos.length ; i++){
        newBlock[i]= {};
        if(direction === Direction.TURN_LEFT){
            newBlock[i].x= (form[i].y * -1 + (maxY-minY)) + minX;
            newBlock[i].y= form[i].x + minY;
        }
        else{
            newBlock[i].x= form[i].y + minX;
            newBlock[i].y= (form[i].x * -1 + (maxX-minX)) + minY;
        }    
    }
    return rotationBorderAdaptation(newBlock);
}

function rotationBorderAdaptation(newBlock){
    /*déplace le bloc sur le coté pour éviter d'étre bloqué par un bord*/
    let move= 0;
    for(let i= 0 ; i < newBlock.length; i++){
        if(newBlock[i].x < 0 && newBlock[i].x < move
        ||newBlock[i].x > NB_CASES_X-1 && newBlock[i].x > move){
            move= newBlock[i].x;
        }
    }
    if(move > NB_CASES_X-1) move-= NB_CASES_X-1;
    move*= -1;

    if(move !== 0){
        for(let i= 0 ; i < newBlock.length; i++){
            newBlock[i].x+= move;
        }
    }
    return newBlock;
}

function newBlock(){
    /*retourne un nouveau block aléatoirement*/
    const forms= [
        [{x: 0, y: 0},{x: 0, y: 1},{x: 1, y: 0},{x: 1, y: 1}],
        [{x: 0, y: 0},{x: 0, y: 1},{x: 1, y: 1},{x: 0, y: 2}],
        [{x: 0, y: 0},{x: 0, y: 1},{x: 0, y: 2},{x: 1, y: 2}],
        [{x: 0, y: 0},{x: 0, y: 1},{x: 0, y: 2},{x: 0, y: 3}],
        [{x: 0, y: 0},{x: 0, y: 1},{x: 1, y: 1},{x: 1, y: 2}]
    ];
    let NewBlock= {};

    NewBlock.pos= forms[Math.floor(Math.random()*(forms.length))];
    NewBlock.color= Math.floor(Math.random() * gradients.length);

    return NewBlock;
}

function loadGradients(){
    const colors= ["0000FF", "FF0000", "FFFF00", "00FF00", "00FFFF", "800000", "008000", "000080"];
    for(let i= 0 ; i < colors.length ; i++){
        let imgCanvas= document.createElement("canvas");
        imgCanvas.height= SIZE;
        imgCanvas.width= SIZE;
        let ctxImg= imgCanvas.getContext('2d');
        let gradient= ctxImg.createLinearGradient(0, SIZE+SIZE*3,  SIZE+SIZE*2, 0);
        gradient.addColorStop(0.7, "#" + colors[i]);
        gradient.addColorStop(1, "#FFF");
        ctxImg.fillStyle= gradient;
        ctxImg.fillRect(0, 0, SIZE, SIZE);
        gradients.push(imgCanvas);       
    }
}

function setNewPosition(NewBlock){
    /*positionnement du block lors de son apparition*/
    let x= Math.floor(Math.random()*(NB_CASES_X-1)); //inutile de prendre en compte la dernière ligne, les éléments font tous au moins 2 cases
    let offset= 1;
    
    if(x >= NB_CASES_X-offset) x= NB_CASES_X-offset;
    let newBlockPos= new Array();

    for (let i = 0; i < NewBlock.pos.length; i++) {
        newBlockPos[i]= {};
        newBlockPos[i].x= x + NewBlock.pos[i].x;
        newBlockPos[i].y= NB_CASES_Y + NewBlock.pos[i].y;
    }
    NewBlock.pos= newBlockPos;
    return NewBlock;
}

function loadGradients(){
    const colors= ["0000FF", "FF0000", "FFFF00", "00FF00", "00FFFF", "800000", "008000", "000080"];
    for(let i= 0 ; i < colors.length ; i++){
        let imgCanvas= document.createElement("canvas");
        imgCanvas.height= SIZE;
        imgCanvas.width= SIZE;
        let ctxImg= imgCanvas.getContext('2d');
        let gradient= ctxImg.createLinearGradient(0, SIZE+SIZE*3,  SIZE+SIZE*2, 0);
        gradient.addColorStop(0.7, "#" + colors[i]);
        gradient.addColorStop(1, "#FFF");
        ctxImg.fillStyle= gradient;
        ctxImg.fillRect(0, 0, SIZE, SIZE);
        gradients.push(imgCanvas);       
    }
}

function reset(){
    /*réinitalise le jeu*/
    for(let x= 0 ; x < NB_CASES_X ; x++){
        casesBlocks[x]= [];
        for(let y= 0 ; y < NB_CASES_Y+5 ; y++){
            casesBlocks[x][y]= {value: false, color: 0};
        }
    }
    currentBlock= [];
    nextBlocks=[];
    rowsFull= [];
    interval= START_INTERVAL;
    oldTime= Date.now();
    duration= 0;
    score= 0;
    completedRows= 0;
    lsInput= [];
    keySpace= false;
    loop= LoopStatus.NORMAL;
    displayScore();
}

function initTouch(){
    try{
        document.createEvent("TouchEvent");
        document.getElementById("inputTop").addEventListener('touchstart', touchInput);
        document.getElementById("inputTop").addEventListener('touchend', testTouchBottom);
        document.getElementById("inputLeft").addEventListener('touchstart', touchInput);
        document.getElementById("inputRotation").addEventListener('touchstart', touchInput);
        document.getElementById("inputRight").addEventListener('touchstart', touchInput);
        isTouchScreen= true;
    }
    catch{
        document.getElementById("touchScreen").style.display= "none";
        isTouchScreen= false;
    }
}
function touchInput(e){
    switch (e.currentTarget.id) {
        case "inputLeft":
            lsInput.push(37);
            break;
        case "inputRotation":
            lsInput.push(38);
            break;
        case "inputRight":
            lsInput.push(39);
            break;
        default:
            lsInput.push(13);
            YTouch= e.changedTouches[0].clientY;
            break;
    }
    e.preventDefault();
}
function testTouchBottom(e){
    if(YTouch && YTouch+50 < e.changedTouches[0].clientY) lsInput.push(65);
    YTouch= null
}