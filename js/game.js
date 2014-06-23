//$(document).ready(function(){

	/* ENTITIES */

	var entityManager = game.getEntityManager();
	entityManager.addEntityType('wall', {}, {
		passable: false,
		symbol: '#',
		color: 'gray'
	});

	entityManager.addEntityType('tutor', {
		getName: function() {
			return String.ucfirst(this.getData('skill')) + ' tutor';
		},
		onInteract: function() {
			var skill = this.getData('skill');
			game.speech(this, {
				text: 'Hello! Do you want to train some ' + skill + ' skills here?', responses: [
					{text: "Yes!", callback: function(entity) {
						var skill = entity.getData('skill');
						var xp = entity.getData('xp');
						var duration = entity.getData('duration');
						if(game.getPlayer().getStat(skill).level >= 3) {
							game.speech(entity, {
								text: 'Sorry, but you already know everything i can teach you.'
							});
						} else {
							game.setTimedAction('Training ' + skill + '...', duration, function() {
								game.getPlayer().addXp(skill, xp);
							});
						}
					}},
					{text: "No!", modal: {text: 'Okay, have a nice day!'}}
				]
			});
		}
	}, {
		skill: 'attack',
		xp: 5,
		duration: 5000,
		symbol: 'T',
		color: 'blue'
	});

	entityManager.addEntityType('villager', {
		onInteract: function() {
			if(game.getPlayer().hasQuest('Wolf hunter')) {
				if(game.getPlayer().hasItem('Wolf\'s skin', 5)) {
					game.speech(this, {
						text: 'Ah, thank you so much. Now i should not fear wolves anymore. Here, take this as reward:',
						callback: function() {
							game.getPlayer().completeQuest("Wolf hunter");
							game.getPlayer().removeItem('Wolf\'s skin', 5);
							game.getPlayer().addItem('Elvish bow');
						}
					});
				} else {
					game.speech(this, {
						text: 'Please bring me five wolf skins.'
					});
				}
			} else {
				game.speech(this, {
					text: 'Hello, can you help me please?',
					responses: [
						{
							text: 'Yes, what can i do?',
							callback: function(entity) {
								game.speech(entity, {
									text: 'There are wild wolves in forest near my house. Please go and kill some of them and bring me five wolf skins.'
								});
								game.getPlayer().addQuest('Wolf hunter');
							}
						},
						{
							text: 'Sorry, i am busy right now.',
							modal: {
								text: 'Okay, maybe next time.'
							}
						}
					]
				});
			}
		},
		onAction: function() {
			if(Math.random() * 100 > 95) {
				if(Math.random() * 100 > 75) {
					this.move('up');
				} else if(Math.random() * 75 > 50) {
					this.move('down');
				} else if(Math.random() * 50 > 25) {
					this.move('left');
				} else {
					this.move('right');
				}
			}
		}
	}, {
		dynamic: true,
		color: 'white',
		symbol: 'v'
	});

	entityManager.addEntityType('enemy', {

	}, {
		enemy: true,
		color: 'red',
		symbol: 'x',
		stats: {
			currentHp: 20,
			maxHp: 20,
			attack: 3,
			defence: 2,
			speed: 1
		}
	});

	/* ITEMS */

	game.addItem("Demon hunter's blade", {
		name:'Demon hunter\'s blade',
		type: 'weapon',
		description: 'A sharp blade.',
		favor: '"I can cut your soul in half."',
		equip: 'right hand',
		stats: {
			attack: 100
		}
	});

	game.addItem("Elvish bow", {
		name:'Elvish bow',
		type: 'weapon',
		description: 'A strange piece of wood, curved into shape of bow.',
		favor: 'Elves have strange sense of humor.',
		stats: {
			attack: 5
		}
	});

	game.addItem("Wolf's skin", {
		name: "Wolf's skin",
		type: 'cape',
		description: 'A piece of wolf\'s skin',
		equip: 'body',
		stats: {
			defence: 1
		}
	});

	/* QUESTS */

	game.addQuest('Wolf hunter', {
		name: 'Wolf hunter',
		description: 'I must go to forest near villager\'s house and kill some wolves. Then i must bring him five wolf skins.'
	});

	/* MAP */

	var mapManager = game.getMapManager(), map = mapManager.createMap();
	map.setBorder(-30,-30,30,30);
	map.setEntity(1,2,'wall');
	map.setEntity(2,2,'tutor');
	map.setEntity(3,2,'wall');
	map.setEntity(4,2,'tutor', {skill: 'defence'});
	map.setEntity(5,2,'wall');
	map.setEntity(6,2,'tutor', {skill: 'speed'});
	map.setEntity(7,2,'wall');

	var i = 0;
	while(i++<7) {
		map.setEntity(i,3,'wall');
	}
	map.setEntity(4,9,'villager');

	map.setEntity(-5,-5,'enemy', {
		name: 'Wolf',
		symbol: 'W',
		drop: {
			items: {
				'Wolf\'s skin': 50
			},
			gold: 5
		}
	});

	mapManager.addMap('default', map);
	game.getMapManager().setCurrentMap('default', false);

//});
