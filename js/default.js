var map = new Map();
map.setPoint(3,3,'wall');
map.setPoint(-1,0,{
	'isDynamic': function() {return false},
	'isPassable': function() {return true},
	'onCollide': function() {},
	'onInteract': function() {game.showModal('speech', {
		nick: 'Pete', text: 'Hello traveler!', responses: [
			{text: "Hello!", modal: {nick: 'Pete', text: 'Have a nice day!'}},
			{text: "Go away!", modal: {nick: 'Pete', text: 'What? I didn\'t deserve it!'}}
		]});
	},
	'getChar': function() {return 'o'},
	'getColor': function() {return 'red'},
	'getDescription': function() {return 'Pete'}
});

map.setPoint(15,10,{
	'isDynamic': function() {return false},
	'isPassable': function() {return true},
	'onCollide': function() {},
	'onInteract': function() {game.showModal('speech', {
		nick: 'Attack tutor', text: 'Hello! Do you want to train some attack skills here?', responses: [
			{text: "Yes!", callback: function(){
				game.setTimedAction('Training attack...', 5000, function() {
					game.addXp('attack', 5);
				});
			}},
			{text: "No!", modal: {nick: 'Attack tutor', text: 'Okay, have a nice day!'}}
		]});
	},
	'getChar': function() {return 'X'},
	'getColor': function() {return 'green'},
	'getDescription': function() {return 'Attack tutor'}
});

map.fromArray(-10, -10, [
	['#','#','#','#','#'],
	['#',' ',' ',' ','#'],
	['#',' ',' ',' ','#'],
	['#',' ',' ',' ','#'],
	['#',' ',' ',' ','#']
], {'#': 'wall'});

game = new Game(map);
