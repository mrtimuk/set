/*

model:
game
  board
  deck
  selections
  solutions

view:
  board-svg
  hints

*/

var svgns = "http://www.w3.org/2000/svg";
var xlinkns = "http://www.w3.org/1999/xlink";
var possibleSets = 0;

var boardWidth = 5;
var boardHeight = 3;
var timeAllowed = 80;

// Set up the board with card spaces
var elBoard = document.getElementById('svgBoard');
for (var i = 0; i < boardHeight; i++)
	for (var j = 0; j < boardWidth; j++)
	{
    var elCard = document.createElementNS(svgns, 'g');
    elCard.id = 'c' + j + i;
    elCard.setAttributeNS(null, "transform", "translate(" + (j * 50) + " " + (i * 85) + ")");
    
	elCard.addEventListener('click', createClickHandler(j,i), false);
    elCard.addEventListener('touchend', createClickHandler(j,i), false);
	elBoard.appendChild(elCard);
	}

var colours = ['red', 'green', 'blue'];
var shapes = ['wotsit', 'sausage', 'diamond'];
var fills = ['empty', 'hatched', 'solid'];
var maxNumber = 3;
var properties = ['colour', 'shape', 'number', 'fill'];

// Create the deck: 3 shapes, 3 colours, 3 numbers, 3 gradents = 81 cards
var deck = new Array(maxNumber * fills.length * shapes.length * colours.length);
for (var i = 0; i < deck.length; i++)
{
	var colour = colours[Math.floor(i / (maxNumber * fills.length * shapes.length))];
	var shape = shapes[Math.floor(i / (maxNumber * fills.length)) % shapes.length]
	var fill = fills[Math.floor(i / maxNumber) % fills.length];
	var number = i % maxNumber;
	deck[i] = { colour: colour, shape: shape, fill: fill, number: number };
}
var deckPointer = 0;
var selections = [];

// Create the board
var board = new Array(boardWidth);
for (var i = 0; i < board.length; i++)
  board[i] = new Array(boardHeight);

// Scoring
var totalPoints;
elTotalPoints = document.getElementById("score");
function updatePoints(v) {
  totalPoints = v;
  elTotalPoints.innerHTML = zeroPad(totalPoints, 3);
}
updatePoints(0);

var nSets;
var elNSets = document.getElementById('sets');
function updateNSets(n) {
  nSets = n;
  elNSets.innerHTML = zeroPad(nSets, 2);
}
updateNSets(0);

var moveTimer = 0;
var elTimerBar = document.getElementById("moveTimerBar");
function updateMoveTimer(v) {
  moveTimer = v;
  elTimerBar.style.width = ((moveTimer * 100) / timeAllowed) + "%";
}

function zeroPad(n, w) {
  return '<font color="#555">' + Array(Math.max(0, w - (n+"").length) + 1).join("0") + '</font>' + n;  
}

function createClickHandler(x, y) {
  return function(evt) { cardClicked(x,y); if (evt.type=='touchend') evt.preventDefault(); }
}

var elSet = document.getElementById('elSet');
var elInstructions = document.getElementById('elInstructions');
function cardClicked(x,y) {
  if (board[x][y] == null)
    return;

  board[x][y].selected = !board[x][y].selected;
  drawCard(document.getElementById('c' + x + y), board[x][y]);
  
  if (board[x][y].selected) selections.push(board[x][y]);
  else selections.splice(selections.indexOf(board[x][y]), 1);
  
  var selected = selections.length;
  elInstructions.innerHTML = 
    (selected < 3 ? ("Select " + (3 - selected) + " card" + (selected != 2 ? "s" : "")) :
    selected > 3 ? ("Unselect " + (selected - 3) + " card" + (selected != 4 ? "s" : "")) :
    "" ) + "<br>";
  
  var check = checkCombo(selections);
  if (check.set)
  {
    updateNSets(nSets + 1);
    elSet.style.display = 'block';
    
    updatePoints(totalPoints + moveTimer);
    updateMoveTimer(0);

    setTimeout(function() {
      elSet.style.display = 'none';

      // Remove the set and deal
      for (var x = 0; x < boardWidth; x++)
        for (var y = 0; y < boardHeight; y++)
          if (board[x][y] != null && board[x][y].selected)
            board[x][y] = null;
      selections = [];
      dealSpaces();
      updateBoard();
    }, 1000);
  }
  else 
    elInstructions.innerHTML += check.reason;
}

function uniqueProperty(prop, combo, index)
{
  for (var i = 0; i < index; i++)
    if (combo[i].card[prop] == combo[index].card[prop]) 
      {
        //alert ('Card ' + (index+1) + '('+ combo[index].card[prop] +') is the same as card ' + 
        //  (i+1) + '(' + combo[i].card[prop] + ')');
        return false;
      }
  return true;
}

function identicalProperty(prop, combo, index)
{
  return (combo[0].card[prop] == combo[index].card[prop]);
}

function checkCombo(combo)
{
  if (combo.length < 2) // firstPair reqs len > 1
    return { set:false, reason:'' };
  
  var ret = { set: combo.length == 3, reason:'' };
  for (var ip = 0; ip < properties.length; ip++)
  {
    var prop = properties[ip];
    var firstPair = combo[0].card[prop] == combo[1].card[prop] ? "identical" : "unique";
  
    for (var is = 2; is < combo.length; is++)
    {
      if (!window[firstPair + 'Property'](prop, combo, is))
      {
        ret.set = false;
        ret.reason += 'The ' + prop + 's are neither unique nor identical<br>';
      }
    }
  }
  return ret;
}

function countSets()
{
  var setsfound = [];
  for (var i = 0; i < boardWidth * boardHeight; i++)
  {
    var icard = board[i % boardWidth][Math.floor(i / boardWidth) % (boardHeight)];
    if (icard == null)
      continue;
    for (var j = i + 1; j < boardWidth * boardHeight; j++)
    {
      var jcard = board[j % boardWidth][Math.floor(j / boardWidth) % (boardHeight)];
      if (jcard == null)
        continue;
      for (var k = j + 1; k < boardWidth * boardHeight; k++)
      {
        var kcard = board[k % boardWidth][Math.floor(k / boardWidth) % (boardHeight)];
        if (kcard == null)
          continue;
        if (checkCombo([icard, jcard, kcard]).set)
          setsfound.push([icard.card, jcard.card, kcard.card]);
      }
    }
  }
  possibleSets = setsfound.length;
  return setsfound;
}

function describeCard(card)
{
  return (card.number+1) + " " + card.colour  + " " + card.fill + " " + card.shape + (card.number > 0 ? 's' : '');
}

function shuffle()
{
  for (var i = deck.length - 1; i >= 1; i--)
  {
    var j = Math.floor(Math.random() * i);
    var temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  deckPointer = 0;
}

var elPossibleSets = document.getElementById('elPossibleSets');
var sets;
var hint;
function showHint() 
{
  if (sets.length == 0 || hint > 2)
    return;

  updatePoints(totalPoints - 100); 

  elPossibleSets.innerHTML="";
  var i;
  for (i = 0; i <= hint; i++)
    elPossibleSets.innerHTML += describeCard(sets[0][i])+"<br>";
  if (hint < 2)
    elPossibleSets.innerHTML += "<a href='#hint' onClick='showHint()'>Another hint (Cost: 100)</a><br>";
  for (; i < 2; i++)
    elPossibleSets.innerHTML += "<br>";
 
  hint++;
}
 
function moveTick() {
  if (moveTimer <= 0)
    return;

  updateMoveTimer(moveTimer - 1);

  if (moveTimer > 0)
    setTimeout(moveTick, 500)
}

function dealSpaces()
{
  elPossibleSets.innerHTML = "<br><br><br>";
  possibleSets = 0;

  if (deckPointer < deck.length) 
    for (var i = 0; i < boardHeight; i++)
    	for (var j = 0; j < boardWidth-1; j++)
    		if (board[j][i] == null)
        {
    			board[j][i] = { card: deck[deckPointer++], selected: false };
          setTimeout(function() {
            drawCard(document.getElementById('c' + j + i), board[j][i]);
            dealSpaces();
          }, 80);
          return;
        }
  sets = countSets();
  elPossibleSets.innerHTML = "There are " + sets.length + " possible sets in this grid<br>";

  hint = 0;
  if (sets.length > 0)
  {
    elPossibleSets.innerHTML += "<a href='#hint' onClick='showHint()'>Show a hint (Cost: 100)</a><br><br>";
    updateMoveTimer(timeAllowed);
  }
  moveTick();
}

// Draw card
function drawCard(svgEl, mdlCard)
{
    // Remove previous card
    while (svgEl.lastChild)
        svgEl.removeChild(svgEl.lastChild);
    
    if (mdlCard == null) return;

    // Draw outline
    var svgOutline = document.createElementNS(svgns, 'use');
    svgOutline.setAttributeNS(xlinkns, "xlink:href", "#card");
    svgOutline.setAttributeNS(null, "width", 50);
    svgOutline.setAttributeNS(null, "height", 85);
    svgOutline.setAttributeNS(null, "fill", 
        mdlCard.selected ? "khaki" : "white");
    svgEl.appendChild(svgOutline);

    // Draw shapes
    var card = mdlCard.card;
    var top = 32.5 - card.number * 12.5;
    for (var i = 0; i <= card.number; i++)
    {
      var svgSym = document.createElementNS(svgns, 'use');
      svgSym.setAttributeNS(xlinkns, "xlink:href", "#" + card.shape);
      svgSym.setAttributeNS(null, "stroke", card.colour);
      svgSym.setAttributeNS(null, "width", 40);
      svgSym.setAttributeNS(null, "height", 20);
      svgSym.setAttributeNS(null, "x", 5);      
      svgSym.setAttributeNS(null, "y", top + i * 25);
      
      svgSym.setAttributeNS(null, "fill", 
        card.fill == "empty" ? "none" :
        card.fill == "solid" ? card.colour :
        "url(#" + card.colour + "Hatched)");

      svgEl.appendChild(svgSym);
    }
}

// Redraw board
function updateBoard()
{
  for (var i = 0; i < boardHeight; i++)
  	for (var j = 0; j < boardWidth; j++)
		  drawCard(document.getElementById('c' + j + i), board[j][i]);
}

function deal()
{
	if (nSets > 0 && possibleSets > 0 &&
		!confirm("Whoa - are you sure you want to start again?"))
			return;

  updateMoveTimer(0); // Stops the timer
  elInstructions.innerHTML = "Select 3 cards which form a set";

	selections = [];
	updateNSets(0);

	shuffle();
	for (var x = 0; x < boardWidth; x++)
		for (var y = 0; y < boardHeight; y++)
			board[x][y] = null;
  updateBoard();

  updatePoints(0);

	dealSpaces();

  var elDeal = document.getElementById('elDeal');
  elDeal.innerHTML = "Start again";
  elDeal.className = "btn btn-danger pull-right";
}

shuffle();

// Googly charts
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-43628938-1', 'valutica.co.uk');
  ga('send', 'pageview');
