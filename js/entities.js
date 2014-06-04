var entityManager = game.getEntityManager();
entityManager.addEntityType('wall', {}, {
	passable: false,
	symbol: '#',
	color: 'gray'
});

entityManager.addEntityType('tutor', {
	getName: function() {
		var skill = this.getData('skill');
		return skill.charAt(0).toUpperCase() + skill.slice(1) + ' tutor';
	},
	onInteract: function() {
		var skill = this.getData('skill');
		game.speech(this, {
			text: 'Hello! Do you want to train some ' + skill + ' skills here?', responses: [
				{text: "Yes!", callback: function(entity) {
					var skill = entity.getData('skill');
					var xp = entity.getData('xp');
					var duration = entity.getData('duration');
					game.setTimedAction('Training ' + skill + '...', duration, function() {
						game.getPlayer().addXp(skill, xp);
					});
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
		game.speech(this, {
			text: 'Hello!'
		});
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
	symbol: 'x'
});
// TODO add attack functionality (maybe some modal with attack data... Two health bars... Or something... AND ALSO REFACTOR MAP RENDERING
