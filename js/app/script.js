function Game() {
	var actionCounter = 0;
	var position = {
		x: 0,
		y: 0
	};
	var keyMapping = {
		9: 'Tab',
		13: 'Enter',
		27: 'ESC',
		32: 'Space',
		37: 'Arrow left',
		38: 'Arrow up',
		39: 'Arrow right',
		40: 'Arrow down',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		65: 'A',
		66: 'B',
		67: 'C',
		68: 'D',
		69: 'E',
		70: 'F',
		71: 'G',
		72: 'H',
		73: 'I',
		74: 'J',
		75: 'K',
		76: 'L',
		77: 'M',
		78: 'N',
		79: 'O',
		80: 'P',
		81: 'Q',
		82: 'R',
		83: 'S',
		84: 'T',
		85: 'U',
		86: 'V',
		87: 'W',
		88: 'X',
		89: 'Y',
		90: 'Z',
		96: 'Num 0',
		97: 'Num 1',
		98: 'Num 2',
		99: 'Num 3',
		100: 'Num 4',
		101: 'Num 5',
		102: 'Num 6',
		103: 'Num 7',
		104: 'Num 8',
		105: 'Num 9',
		106: 'Num *',
		107: 'Num +',
		109: 'Num -',
		110: 'Num .',
		111: 'Num /',
		112: 'F1',
		113: 'F2',
		114: 'F3',
		115: 'F4',
		116: 'F5',
		117: 'F6',
		118: 'F7',
		119: 'F8',
		120: 'F9',
		121: 'F10',
		122: 'F11',
		123: 'F12'
	};
	var controls = {
		'up': 87,
		'down': 83,
		'left': 65,
		'right': 68,
		'interact': 32,
		'answer1': 97,
		'answer2': 98,
		'answer3': 99,
		'cancel': 27
	};
	var settings = {
		autoSave: true,
		autoSaveMessage: true
	};
	var stats = {};
	var modalOpened = 'none', modalMode = '', timedAction = undefined;
	var speechEntity = undefined, speechData = {};
	var lastSave = new Date().getTime();
	var $map = $('#map'), $position = $('#position'), $menu = $('#menu'), $modal = $('#modal'),
		$stats = $('#stats'), $modalContent = $('#modal-content');

	var entityManager = new EntityManager();
	var mapManager = new MapManager(entityManager, $map, $position);

	var renderer = new Renderer();
	var player = new Player(this);

	this.saveInterval = 1000 * 10;
	this.storage = new DataStorage();

	this.getRenderer = function() {
		return renderer;
	};

	this.getMapManager = function() {
		return mapManager;
	};

	this.getMap = function() {
		return mapManager.getCurrentMap();
	};

	this.getEntityManager = function() {
		return entityManager;
	};

	this.getPlayer = function() {
		return player;
	};

	this.renderMap = function() {
		this.getMap().render(position.x, position.y);
	};

	this.getPosition = function() {
		return position;
	};

	this.renderDescription = function($object) {
		$object.after(
			$('<pre></pre>')
				.addClass('description')
				.html($object.data('description'))
		);
	};

	this.hideDescription = function() {
		$('.description').remove();
	};

	this.onKeyDown = function(e) {
		if(e.which === 187) {
			e.which = 49; // for 1 or + key
		}
		var action = this.getActionByKey(e.which);

		if(modalOpened !== 'none') {
			if(modalOpened === 'controls' && this.getModalMode() !== '') {
				if(this.getActionByKey(e.which) === undefined) {
					this.setControl(this.getModalMode(), e.which);
				}
				this.setModalMode('');
				this.showModal('controls');
				e.preventDefault();
			} else if(action === 'cancel') {
				this.hideModal();
				this.setModalMode('');
				this.stopTimedAction();
				e.preventDefault();
			} else if(modalOpened === 'speech') {
				if(typeof speechData.responses !== 'undefined' && Array.size(speechData.responses) > 0) {
					if(typeof action !== 'undefined' && action.substr(0, 6) === 'answer') {
						this.respond(Number(action.substr(6,1)) - 1);
					}
				} else {
					speechData = {};
					this.setModalMode('');
					this.hideModal();
				}
				e.preventDefault();
			}
			return;
		}

		//this.addToLog(e.which + ' = ' + keyMapping[e.which]);
		if(typeof action !== 'undefined') {
			e.preventDefault();
		} else {
			return;
		}

		if(!this.canAct()) {
			return;
		}
		if(action === 'left' || action === 'right' || action === 'up' || action === 'down') {
			this.move(action);
		} else if(action === 'interact') {
			var entity = this.getMap().getEntity(position.x, position.y);
			entity.onInteract();
			if(entity.isEnemy()) {
				entity.onAttack();
				this.onAttack(entity);
			}
		}
	};

	this.move = function(direction) {
		var x = 0, y = 0;
		if(direction === 'left') {
			x--;
		} else if(direction === 'right') {
			x++;
		} else if(direction === 'up') {
			y--;
		} else if(direction === 'down') {
			y++;
		}
		var n = {
			x: position.x + x,
			y: position.y + y
		};
		var point = this.getMap().getEntity(n.x, n.y);
		if(point.isPassable() && !this.getMap().isOutOfBorder(n.x, n.y)) {
			this.getRenderer().renderPoints(this.getMap(), [
				{x: position.x, y: position.y},
				{x: n.x, y: n.y}
			], n);
			position = n;
			point.onCollide();
			if(point.isEnemy() && point.isAggressive()) {
				point.onAttack();
				this.onAttack(point);
			}
		}
	};

	this.canAct = function() {
		return modalOpened === 'none';
	};

	this.showModal = function(type, data) {
		if(typeof data === 'undefined') {
			data = {};
		}
		var $content = $('#modal-content');
		if(type === 'controls') {
			$content.html( 'CONTROLS<br>' +
				'========<br>' +
				'Move up&nbsp;&nbsp;&nbsp;&nbsp;| <span data-control="up">' + keyMapping[this.getKeyByAction('up')] + '</span><br>' +
				'Move down&nbsp;&nbsp;| <span data-control="down">' + keyMapping[this.getKeyByAction('down')] + '</span><br>' +
				'Move left&nbsp;&nbsp;| <span data-control="left">' + keyMapping[this.getKeyByAction('left')] + '</span><br>' +
				'Move right&nbsp;| <span data-control="right">' + keyMapping[this.getKeyByAction('right')] + '</span><br>' +
				'Interact&nbsp;&nbsp;&nbsp;| <span data-control="interact">' + keyMapping[this.getKeyByAction('interact')] + '</span><br>' +
				'Answer 1&nbsp;&nbsp;&nbsp;| <span data-control="answer1">' + keyMapping[this.getKeyByAction('answer1')] + '</span><br>' +
				'Answer 2&nbsp;&nbsp;&nbsp;| <span data-control="answer2">' + keyMapping[this.getKeyByAction('answer2')] + '</span><br>' +
				'Answer 3&nbsp;&nbsp;&nbsp;| <span data-control="answer3">' + keyMapping[this.getKeyByAction('answer3')] + '</span><br>' +
				'Cancel&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| <span data-control="cancel">' + keyMapping[this.getKeyByAction('cancel')] + '</span><br>' +
				'<br><span style="color: gray">Click a key to edit it.</span>'
			);
		} else if(type === 'timed') {
			$content.html(
				$('<div class="bar"></div>').append(
					$('<div class="bar-title"></div>').html(data.title)
				).append(
					$('<div class="bar-inner"></div>')
				)
			);
		} else if(type === 'settings') {
			$content.html(
				'SETTINGS<br>' +
				'========<br>' +
				'<span data-settings="autoSave">' + (settings.autoSave ? '[*]' : '[ ]') + ' Auto save every 10 seconds.</span><br>' +
				'<span data-settings="autoSaveMessage">' + (settings.autoSaveMessage ? '[*]' : '[ ]') + ' Display auto save message.</span><br>' +
				'<br>'
			);
		}

		modalOpened = type;
		$modal.show();
	};

	this.hideModal = function() {
		modalOpened = 'none';
		$modal.hide();
	};

	this.respond = function(response) {
		if(modalOpened !== 'speech') {
			return;
		}
		var data = speechData.responses[response];
		Logger.log('You', data.text);
		if(typeof data.modal !== 'undefined') {
			this.speech(speechEntity, data.modal);
		}
		if(typeof data.callback !== 'undefined') {
			data.callback(speechEntity);
		}
	};

	this.setModalMode = function(mode) {
		modalMode = mode;
	};

	this.getModalMode = function() {
		return modalMode;
	};

	this.speech = function(entity, speech) {
		speechEntity = entity;
		speechData = speech;
		$modalContent.html('');
		var name = entity.getName(), text = speech.text;
		Logger.log(name, text);
		if(typeof speechData.responses !== 'undefined' && Array.size(speechData.responses)) {
			var content = '[' + name + ']<br><br>' + text + '<br><br><br><span style="color: gray">Select your response:</span><br><br>';
			for(var i in speechData.responses) {
				content += '&nbsp;&nbsp;<span data-response="' + i + '">' + (Number(i) + 1) + '. ' + speechData.responses[i].text + '</span><br>';
			}
			$modalContent.html(content)
		} else {
			$modalContent.html('[' + name + ']<br><br>' + text + '<br><br><br>&nbsp;&nbsp;<span style="color: gray">Press any key to close.</span>');
		}
		modalOpened = 'speech';
		$modal.show();
	};

	this.getKeyByAction = function(action) {
		return controls[action];
	};

	this.getActionByKey = function(key) {
		for(var action in controls) {
			if(controls[action] === key) {
				return action;
			}
		}
		return undefined;
	};

	this.setControl = function(action, key) {
		controls[action] = key;
		this.save();
	};

	this.getStat = function(name) {
		return this.getPlayer().getStat(name);
	};

	this.addXp = function(name, value) {
		this.getPlayer().addXp(name, value);
	};

	this.renderStats = function() {
		$stats.html('');
		var current = this.getPlayer().getCurrentHp(), max = this.getPlayer().getMaxHp();
		$stats.append(
			$('<div class="bar health"></div>').append(
				$('<div class="bar-title"></div>').html(current + '/' + max + ' HP')
			).append(
				$('<div class="bar-inner"></div>').css('width', String(current / max * 100) + '%')
			)
		);
		var stats = this.getPlayer().getStats();
		for(var k in stats) {
			var stat = stats[k];
			var description = stat.title + ' level ' + stat.level + ' (' + stat.xp + '/' + (stat.level * 10) + ' xp)';
			$stats.append(
				$('<div class="bar" data-description="' + description + '"></div>').append(
					$('<div class="bar-title"></div>').html(stat.title + ' level ' + stat.level)
				).append(
					$('<div class="bar-inner"></div>').css('width', String(stat.xp / (stat.level * 10)*100) + '%')
				)
			);
		}
	};

	this.setTimedAction = function(title, time, callback) {
		if(timedAction === undefined) {
			var start = new Date().getTime();
			timedAction = {title: title, start: start, finish: start + time, callback: callback};
			this.showModal('timed', timedAction);
		}
	};

	this.stopTimedAction = function() {
		timedAction = undefined;
	};

	this.onAttack = function(entity) {
		var current = this.getPlayer().getCurrentHp(), max = this.getPlayer().getMaxHp();
		Logger.log('FIGHT', entity.getName() + ' has attacked you.', 'red');
		/*$modalContent.html(
			'<div style="text-align: center;"><span style="color: green">You</span> VS <span style="color: red">'
			+ entity.getName() + '</span></div>'
		).append(
			$('<div class="bar health"></div>').append(
				$('<div class="bar-title"></div>').html(current + '/' + max + ' HP')
			).append(
				$('<div class="bar-inner"></div>').css('width', String(current / max * 100) + '%')
			)
		);
		$modal.show();
		modalOpened = 'attack';*/

		var pDamage, eDamage, attXp = 1, defXp = 1;

		while(this.getPlayer().getCurrentHp() !== 0 && entity.getCurrentHp() !== 0) {
			pDamage = entity.damage(this.getPlayer().getStat('attack').level - entity.getDefence());
			eDamage = this.getPlayer().damage(entity.getAttack() - this.getPlayer().getStat('defence').level);
			Logger.log('FIGHT', 'You have dealt ' + pDamage + ' damage to ' + entity.getName(), 'green');
			Logger.log('FIGHT', entity.getName() + ' has dealt ' + eDamage + ' damage to you.', 'red');
			attXp += pDamage / 10;
			defXp += eDamage / 10;
		}
		if(this.getPlayer().getCurrentHp() === 0) {
			Logger.log('FIGHT', 'You have been killed by ' + entity.getName() + '.', 'red');
		} else {
			Logger.log('FIGHT', 'You have killed ' + entity.getName() + '.', 'green');
			this.getMap().setEntity(position.x, position.y, 'empty space');
			this.getMap().render(position.x, position.y);
			this.getPlayer().addXp('attack', attXp);
			this.getPlayer().addXp('defence', defXp);
		}
	};

	this.toggleSettings = function(key) {
		settings[key] = !settings[key];
		this.showModal('settings');
	};

	this.onSecond = function() {
	};

	this.tick = function() {
		if(timedAction !== undefined) {
			var time = new Date().getTime() - timedAction.start;
			var length = timedAction.finish - timedAction.start;
			var percentage = (time / length) * 100;
			if(percentage >= 100) {
				timedAction['callback']();
				timedAction = undefined;
				this.hideModal();
			} else {
				$modal.find('.bar-inner').css('width', String(percentage) + '%');
			}
		}
		if((++actionCounter) % 10 === 0) {
			this.getMap().onTick();
		}
		if(actionCounter === 100) {
			actionCounter = 0;
			this.onSecond();
		}
		if(lastSave + this.saveInterval <= new Date().getTime()) {
			if(settings.autoSave) {
				this.save();
				if(settings.autoSaveMessage) {
					Logger.log('AutoSave', 'Game saved.', 'gray');
				}
			}
			lastSave = new Date().getTime();
		}
	};

	this.save = function() {
		this.storage.save('player', this.getPlayer().getSaveData());
		this.storage.save('position', position);
		this.storage.save('controls', controls);
		this.storage.save('settings', settings);
	};

	this.load = function() {
		this.getPlayer().setSaveData(this.storage.load('player', this.getPlayer().getSaveData()));
		position = this.storage.load('position', position);
		controls = this.storage.load('controls', controls);
		settings = this.storage.load('settings', settings);
	};

	this.registerEvents = function() {
		$('body').on('keydown', function(e) {
			game.onKeyDown(e);
		});

		$map.on('mouseover', 'span[data-description]', function() {
			game.getRenderer().renderEntityDescription($(this));
		}).on('mouseout', 'span[data-description]', function() {
			game.getRenderer().hideEntityDescription();
		});

		$stats.on('mouseover', 'div[data-description]', function() {
			game.renderDescription($(this));
		}).on('mouseout', 'div[data-description]', function() {
			game.hideDescription();
		});

		$menu.on('click', 'span.menu-item', function() {
			if(!game.canAct()) {
				return;
			}
			var action = $(this).data('action');
			if(action === 'clear-log') {
				Logger.clear();
			} else if(action === 'controls') {
				game.showModal('controls');
			} else if(action === 'save') {
				game.save();
				Logger.log('INFO', 'Game saved.', 'gray');
			} else if(action === 'center-map') {
				$map.css('left', 0).css('top', 0);
			} else if(action === 'settings') {
				game.showModal('settings');
			}
		});

		$modal.on('click', '.modal-close', function() {
			game.hideModal();
		});

		$modal.on('click', '[data-response]', function() {
			game.respond($(this).data('response'));
		});

		$modal.on('click', '[data-settings]', function() {
			game.toggleSettings($(this).data('settings'));
		});

		$modal.on('click', 'span[data-control]', function() {
			var $self = $(this);
			if(game.getModalMode() === '') {
				game.setModalMode($self.data('control'));
				$self.text('<press a key>').addClass('choosing');
			}
		});

		setInterval(function() {
			game.tick();
		}, 10);
	};

	this.start = function() {
		this.load();
		this.save();
		this.registerEvents();
		this.renderMap();
		this.getPlayer().onStart();
	};
}

function Player(game) {
	var currentHp = 10, maxHp = 10;
	var stats = {};
	var defaultStats = {
		attack: 'Attack',
		defence: 'Defence',
		speed: 'Speed'
	};

	function renderStats() {
		game.getRenderer().renderStats({
			currentHp: currentHp,
			maxHp: maxHp,
			stats: stats
		});
	}

	this.getGame = function() {
		return game;
	};

	this.getCurrentHp = function() {
		return ~~currentHp;
	};

	this.setCurrentHp = function(value) {
		var delta = currentHp - this.getCurrentHp();
		currentHp = value + delta;
		renderStats();
	};

	this.getMaxHp = function() {
		return maxHp;
	};

	this.damage = function(value) {
		var c = this.getCurrentHp();
		if(value < 0) value = 0;
		currentHp -= value;
		renderStats();
		return c - this.getCurrentHp();
	};

	this.addStat = function(name, title, render) {
		stats[name] = {
			title: title,
			xp: 0,
			level: 1
		};
		if(typeof render === 'undefined') {
			render = true;
		}
		if(render) {
			renderStats();
		}
	};

	this.getStat = function(name) {
		return stats[name];
	};

	this.getStats = function() {
		return stats;
	};

	this.addXp = function(name, value) {
		var stat = this.getStat(name);
		value = ~~value;
		if(typeof stat !== 'undefined') {
			stat.xp += value;
			Logger.log('INFO', 'You received ' + value + ' xp in ' + stat.title + '.', 'yellow');
			while(stat.xp >= stat.level * 10) {
				stat.xp -= stat.level * 10;
				stat.level++;
				Logger.log('INFO', stat.title + ' level up.', 'yellow');
			}
			renderStats();
		}
	};

	this.getSaveData = function() {
		return {
			currentHp: currentHp,
			maxHp: maxHp,
			stats: stats
		};
	};

	this.setSaveData = function(data) {
		currentHp = data.currentHp;
		maxHp = data.maxHp;
		stats = data.stats;
	};

	this.onStart = function() {
		renderStats();
	};

	for(var k in defaultStats) {
		this.addStat(k, defaultStats[k], false);
	}
}

function MapManager(entityManager, $map, $position) {
	var maps = {};
	var current = undefined;

	function getEmptyEntity(map) {
		return entityManager.createEntity(map, 'empty space')
	}

	this.createMap = function() {
		var map = new Map(entityManager, $map, $position);
		map.emptyEntity = getEmptyEntity(map);
		return map;
	};

	this.addMap = function(name, map) {
		maps[name] = map;
	};

	this.setCurrentMap = function(name) {
		if(name in maps) {
			current = name;
		}
	};

	this.getCurrentMap = function() {
		if(typeof current !== 'undefined') {
			return maps[current];
		} else {
			return undefined;
		}
	};
}

function Map(entityManager, $map, $position) {
	var entities = {};
	var dynamicEntities = {};
	var needsRender = false;
	var lastRender = {x: 0, y: 0};
	var border = {top: 0, left: 0, bottom: 0, right: 0};
	this.emptyEntity = {};

	function createKey(x, y) {
		return x + '|' + y;
	}

	function renderBorder() {
		$('#map-border')
			.css('top', (border.top + 15) * 21)
			.css('left', (border.left + 32) * 13)
			.css('bottom', (-border.bottom + 14.5) * 21)
			.css('right', (-border.right + 30) * 13);
	}

	this.setBorder = function(top, left, bottom, right) {
		border = {
			top: top,
			left: left,
			right: right,
			bottom: bottom
		};
		renderBorder();
	};

	this.getBorder = function() {
		return border;
	};

	this.isOutOfBorder = function(x, y) {
		return !(x >= border.left && x <= border.right && y >= border.top && y <= border.bottom);
	};

	this.getEntity = function(x, y) {
		var key = createKey(x, y);
		if(key in entities) {
			return entities[key];
		} else {
			var entity = this.emptyEntity;
			entity.setData('position', {x: x, y: y});
			return entity;
		}
	};

	this.setEntity = function(x, y, name, data) {
		if(this.isOutOfBorder(x, y)) return;
		var key = createKey(x, y);
		var entity = entities[key] = entityManager.createEntity(this, name, data);
		entity.setPosition({x: x, y: y});
		if(entity.isDynamic()) {
			dynamicEntities[key] = true;
		}
	};

	this.fromArray = function(x, y, array, types, data) {
		if(typeof data === 'undefined') {
			data = {};
		}
		for(var i in array) {
			for(var j in array[i]) {
				var point = array[j][i];
				if(point !== ' ') {
					this.setEntity(x+Number(i), y+Number(j), types[point], data[point]);
				}
			}
		}
	};

	this.getSaveData = function() {
		var saveData = {};
		for(var key in entities) {
			var data = entities[key].getSaveData();
			if(data !== {}) {
				saveData[key] = data;
			}
		}
		return saveData;
	};

	this.setSaveData = function(data) {
		for(var key in data) {
			if(typeof entities[key] !== 'undefined') {
				entities[key].setSaveData(data[key]);
			}
		}
	};

	this.render = function(x, y) {
		game.getRenderer().renderFullMap(this, game.getPosition());
		/*var pPosition = lastRender = {x: x, y: y}; // TODO FIX RENDERING
		var position = {x: 0, y: 0};
		x = border.left;
		y = border.top;
		var map = '';
		while(y <= border.bottom) {
			while(x <= border.right) {
				if(y == pPosition.y && x == pPosition.x) {
					map += '<span data-description="you' + ' (' + x + '|' + y + ')" style="color: green">@</span>';
				} else {
					var entity = this.getEntity(x, y);
					var symbol = entity.getChar();
					var c = entity.getColor();
					var description = entity.getName() + ' (' + x + '|' + y + ')';
					map += '<span data-description="' + description + '" style="color: ' + c + '">' + symbol + '</span>';
				}
				x++;
			}
			map += '\n';
			x = border.left;
			y++;
		}
		$map.html($('<div id="map-border"></div>').html(map));
		renderBorder();
		//$('#map-border').css('top', -border.top * 21).css('left', -border.left * 13).css('bottom', -border.bottom * 21).css('right', -border.right * 13);
		$position.html('(' + pPosition.x + '|' + pPosition.y + ') - ' + this.getEntity(pPosition.x, pPosition.y).getName());
		needsRender = false;*/
	};

	this.onTick = function() {
		for(var key in dynamicEntities) {
			entities[key].onAction();
		}
		if(needsRender) {
			this.render(lastRender.x, lastRender.y);
		}
	};

	this.moveEntity = function(from, to) {
		var keyFrom = createKey(from.x, from.y), keyTo = createKey(to.x, to.y);
		if(this.isOutOfBorder(to.x, to.y)) return;
		if(typeof entities[keyFrom] !== 'undefined') {
			var entity = entities[keyTo] = entities[keyFrom];
			entity.setPosition(to);
			delete entities[keyFrom];
		}
		if(typeof dynamicEntities[keyFrom] !== 'undefined') {
			dynamicEntities[keyTo] = true;
			delete dynamicEntities[keyFrom];
		}
		game.getRenderer().renderPoints(this, [
			{x: from.x, y: from.y},
			{x: to.x, y: to.y}
		], game.getPosition());
		//needsRender = true;
	};
}

function EntityManager() {
	var types = {};

	this.addEntityType = function(name, defaultMethods, defaultData) {
		if(typeof defaultMethods === 'undefined') {
			defaultMethods = {};
		}
		if(typeof defaultData === 'undefined') {
			defaultData = {};
		}
		if(typeof defaultData.name === 'undefined') {
			defaultData.name = name;
		}
		types[name] = {
			defaultMethods: defaultMethods,
			defaultData: defaultData
		};
	};

	this.createEntity = function(map, name, data) {
		if(!(name in types)) {
			return {};
		}
		if(typeof data === 'undefined') {
			data = {};
		}
		var entityType = types[name];
		var entity = new Entity(map);

		for(var key in entityType.defaultMethods) {
			entity[key] = entityType.defaultMethods[key];
		}

		for(key in entityType.defaultData) {
			entity.setData(key, entityType.defaultData[key]);
		}

		for(key in data) {
			entity.setData(key, data[key]);
		}

		return entity;
	};

	this.addEntityType('empty space');
}

function Entity(map) {
	var data = {};
	var defaultData = {
		passable: true,
		dynamic: false,
		enemy: false,
		aggressive: false,
		color: 'transparent',
		symbol: '&nbsp;',
		name: 'empty space',
		stats: {
			currentHp: 10,
			maxHp: 10,
			attack: 1,
			defence: 1,
			speed: 1
		}
	};

	this.setData = function(key, value) {
		data[key] = value;
	};

	this.getData = function(key, def) {
		if(key in data) {
			return data[key];
		} else {
			return def;
		}
	};

	this.isEmpty = function() {
		return this.getData('name', defaultData.name) === 'empty space';
	};

	this.isPassable = function() {
		return this.getData('passable', defaultData.passable);
	};

	this.isDynamic = function() {
		return this.getData('dynamic', defaultData.dynamic);
	};

	this.isEnemy = function() {
		return this.getData('enemy', defaultData.enemy);
	};

	this.isAggressive = function() {
		return this.getData('aggressive', defaultData.aggressive);
	};

	this.getColor = function() {
		return this.getData('color', defaultData.color);
	};

	this.getChar = function() {
		return this.getData('symbol', defaultData.symbol);
	};

	this.getName = function() {
		return this.getData('name', defaultData.name);
	};

	this.getPosition = function() {
		return this.getData('position', undefined);
	};

	this.setPosition = function(position) {
		this.setData('position', position);
	};

	this.getSaveData = function() {
		var saveData = {};
		for(var key in data) {
			if(typeof defaultData[key] === 'undefined' || defaultData[key] !== data[key]) {
				saveData[key] = data[key];
			}
		}
		return saveData;
	};

	this.setSaveData = function(saveData) {
		for(var key in saveData) {
			data[key] = saveData[key];
		}
	};

	this.move = function(direction) {
		var x = this.getPosition().x, y = this.getPosition().y;
		if(direction === 'left') {
			x--;
		} else if(direction === 'right') {
			x++;
		} else if(direction === 'up') {
			y--;
		} else if(direction === 'down') {
			y++;
		}
		if(map.getEntity(x, y).isEmpty() && !map.isOutOfBorder(x, y)) {
			map.moveEntity(this.getPosition(), {x: x, y: y});
		}
	};

	this.getStats = function() {
		return this.getData('stats', defaultData.stats);
	};

	this.getAttack = function() {
		return this.getStats().attack;
	};

	this.getDefence = function() {
		return this.getStats().defence;
	};

	this.getSpeed = function() {
		return this.getStats().speed;
	};

	this.getCurrentHp = function() {
		return this.getStats().currentHp;
	};

	this.getMaxHp = function() {
		return this.getStats().maxHp;
	};

	this.damage = function(value) {
		var stats = this.getStats();
		var c = stats.currentHp;
		if(value < 0) {
			value = 0;
		}
		stats.currentHp -= value;
		if(stats.currentHp < 0) {
			stats.currentHp = 0;
		}
		this.setData('stats', stats);
		return c - stats.currentHp;
	};

	this.onAttack = function() {

	};

	this.onInteract = function() {

	};

	this.onCollide = function() {

	};

	this.onAction = function() {

	};
}

function DataStorage() {
	var data = {};

	function loadKey(key, def) {
		if(key in localStorage) {
			return JSON.parse(localStorage[key]);
		} else {
			return def;
		}
	}

	function saveKey(key, val) {
		localStorage[key] = JSON.stringify(val);
	}

	this.save = function(key, value) {
		data[key] = value;
		saveKey('data', data);
	};

	this.load = function(key, def) {
		data = loadKey('data', {});
		if(key in data) {
			return data[key];
		} else {
			return def;
		}
	};
}

game = new Game();
