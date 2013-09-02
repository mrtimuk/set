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


// Set up the board with card spaces
var elBoard = document.getElementById('svgBoard');
for (var i = 0; i < 3; i++)
	for (var j = 0; j < 4; j++)
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
var properties = ['colour', 'shape', 'number', 'fill'];

// Create the deck: 3 shapes, 3 colours, 3 numbers, 3 gradents = 81 cards
var deck = new Array(81);
for (var i = 0; i < 81; i++)
{
	var colour = colours[Math.floor(i / 27)];
	var shape = shapes[Math.floor(i / 9) % 3]
	var fill = fills[Math.floor(i / 3) % 3];
	var number = i % 3;
	deck[i] = { colour: colour, shape: shape, fill: fill, number: number };
}
var deckPointer = 0;
var selections = [];

// Create the board
var board = new Array(4);
for (var i = 0; i < 4; i++)
  board[i] = new Array(3);

function createClickHandler(x, y) {
  return function(evt) { cardClicked(x,y); if (evt.type=='touchend') evt.preventDefault(); }
}

var elSet = document.getElementById('elSet');
var elNSets = document.getElementById('elNSets');
var elInstructions = document.getElementById('elInstructions');
var nSets = 0;
function cardClicked(x,y) {
  if (board[x][y] != null)
  {
    board[x][y].selected = !board[x][y].selected;
    drawCard(document.getElementById('c' + x + y), board[x][y]);
    
    if (board[x][y].selected) selections.push(board[x][y]);
    else selections.splice(selections.indexOf(board[x][y]), 1);
    
    var selected = selections.length;
    elInstructions.innerHTML = 
      (selected < 3 ? ("Select " + (3 - selected) + " card" + (selected != 2 ? "s" : "")) :
      selected > 3 ? ("Unselect " + (selected - 3) + " card" + (selected != 4 ? "s" : "")) :
      "" ) + "<br>";
    
    var check = checkCombo();
    if (check.set)
    {
      nSets++;
      updateHints();
      elSet.style.display = 'block';
      setTimeout(function() {
        elSet.style.display = 'none';

        // Remove the set and deal
        for (var x = 0; x < 4; x++)
          for (var y = 0; y < 3; y++)
            if (board[x][y].selected)
            {
              board[x][y] = null;
            }
        selections = [];
        dealSpaces();
        updateBoard();
      }, 1000);
    }
    else 
      elInstructions.innerHTML += check.reason;
  }
}

function uniqueProperty(prop, index)
{
  for (var i = 0; i < index; i++)
    if (selections[i].card[prop] == selections[index].card[prop]) 
      {
        //alert ('Card ' + (index+1) + '('+ selections[index].card[prop] +') is the same as card ' + 
        //  (i+1) + '(' + selections[i].card[prop] + ')');
        return false;
      }
  return true;
}

function identicalProperty(prop, index)
{
  return (selections[0].card[prop] == selections[index].card[prop]);
}

function checkCombo()
{
  if (selections.length < 2)
    return { set:false, reason:'' };
  
  var ret = { set: selections.length == 3, reason:'' };
  for (var ip = 0; ip < properties.length; ip++)
  {
    var prop = properties[ip];
    var firstPair = selections[0].card[prop] == selections[1].card[prop] ? "identical" : "unique";
  
    for (var is = 2; is < selections.length; is++)
    {
      if (!window[firstPair + 'Property'](prop, is))
      {
        ret.set = false;
        ret.reason += 'The ' + prop + 's are neither unique nor identical<br>';
      }
    }
  }
  return ret;
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

function dealSpaces()
{
  if (deckPointer >= 81) return;
  for (var i = 0; i < 3; i++)
  	for (var j = 0; j < 4; j++)
  		if (board[j][i] == null)
      {
  			board[j][i] = { card: deck[deckPointer++], selected: false };
        setTimeout(function() {
          drawCard(document.getElementById('c' + j + i), board[j][i]);
          dealSpaces();
        }, 100);
        return;
        //if (deckPointer >= 81) return;
      }
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
  for (var i = 0; i < 3; i++)
  	for (var j = 0; j < 4; j++)
		  drawCard(document.getElementById('c' + j + i), board[j][i]);
}

function updateHints()
{
  elNSets.innerHTML = nSets < 1 ? '' : 
  'You have ' + nSets + ' set' + (nSets > 1 ? 's' : '') + ' out of 27';
}

function deal()
{
	if (nSets > 0 &&
		!confirm("Whoa - are you sure you want to start again?"))
			return;

  elInstructions.innerHTML = "Select 3 cards which form a set";

	selections = [];
	nSets = 0;
	shuffle();
	for (var x = 0; x < 4; x++)
		for (var y = 0; y < 3; y++)
			board[x][y] = null;
  updateBoard();

  updateHints();
	dealSpaces();

  var elDeal = document.getElementById('elDeal');
  elDeal.innerHTML = "Start again";
  elDeal.className = "btn btn-danger";
}

shuffle();

// Googly charts
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-43628938-1', 'valutica.co.uk');
  ga('send', 'pageview');
