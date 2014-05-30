var entityManager = game.getEntityManager();
entityManager.addEntityType('wall', {}, {
	passable: false,
	char: '#',
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
						game.addXp(skill, xp);
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
	char: 'T',
	color: 'blue'
});
