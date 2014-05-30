function dump(what) {
	console.log(what);
	return what;
}

Array.size = function(arr) {
	var size = 0, key;
	for (key in arr) {
		if (arr.hasOwnProperty(key)) size++;
	}
	return size;
};

function Game() {
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
		123: 'F12',
		187: '1'
	};
	var controls = {
		'up': 87,
		'down': 83,
		'left': 65,
		'right': 68,
		'interact': 32,
		'answer1': 96,
		'answer2': 97,
		'answer3': 98,
		'cancel': 27
	};
	var defaultStats = {
		health: 'Health',
		attack: 'Attack',
		defence: 'Defence',
		speed: 'Speed'
	};
	var stats = {};
	var modalOpened = 'none', modalMode = '', timedAction = undefined;
	var speechEntity = undefined, speechData = {};
	var lastSave = new Date().getTime();
	var $map = $('#map'), $position = $('#position'), $log = $('#log'), $menu = $('#menu'), $modal = $('#modal'),
		$stats = $('#stats'), $modalContent = $('#modal-content');

	var entityManager = new EntityManager();
	var mapManager = new MapManager(entityManager, $map, $position);

	this.saveInterval = 1000 * 30;
	this.storage = new DataStorage();

	this.getMapManager = function() {
		return mapManager;
	};

	this.getMap = function() {
		return mapManager.getCurrentMap();
	};

	this.getEntityManager = function() {
		return entityManager;
	};

	this.renderMap = function() {
		this.getMap().render(position.x, position.y);
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
		var action = this.getActionByKey(e.keyCode);

		if(modalOpened !== 'none') {
			if(modalOpened === 'controls' && this.getModalMode() !== '') {
				if(this.getActionByKey(e.keyCode) === undefined) {
					this.setControl(this.getModalMode(), e.keyCode);
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

		//this.addToLog(e.keyCode + ' = ' + keyMapping[e.keyCode]);
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
			this.getMap().getEntity(position.x, position.y).onInteract();
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
		if(point.isPassable()) {
			position = n;
			point.onCollide();
		}
		this.renderMap();
	};

	this.canAct = function() {
		return modalOpened === 'none';
	};

	this.addToLog = function(line, color) {
		if(typeof color === 'undefined') {
			color = 'white';
		}
		$log.html($log.html() + '<span style="color: ' + color + '">' + line + '</span><br>');
		$log.scrollTop(1e10);
	};

	this.clearLog = function() {
		$log.html('');
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
		this.addToLog('[You] ' + data.text);
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
		console.trace();
		speechData = speech;
		$modalContent.html('');
		var name = entity.getName(), text = speech.text;
		this.addToLog('[' + name + '] ' + text);
		if(typeof speechData.responses !== 'undefined' && Array.size(speechData.responses)) {
			var content = '[' + name + ']<br><br>' + text + '<br><br><br>';
			for(var i in speechData.responses) {
				content += '&nbsp;&nbsp;<span data-response="' + i + '">' + (Number(i) + 1) + '. ' + speechData.responses[i].text + '</span><br>';
			}
			$modalContent.html(content + '<br><br>&nbsp;&nbsp;<span style="color: gray">Select your response.</span>')
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

	this.addStat = function(name, title) {
		stats[name] = {
			title: title,
			xp: 0,
			level: 1
		};
		this.renderStats();
	};

	this.getStat = function(name) {
		return stats[name];
	};

	this.addXp = function(name, value) {
		var stat = this.getStat(name);
		this.addToLog('You recieved ' + value + ' xp in ' + stat.title + '.', 'yellow');
		stat.xp += value;
		while(stat.xp >= stat.level * 10) {
			stat.xp -= stat.level * 10;
			stat.level++;
			this.addToLog(stat.title + ' level up!', 'yellow');
		}
		this.renderStats();
	};

	this.renderStats = function() {
		$stats.html('');
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
		if(lastSave + this.saveInterval <= new Date().getTime()) {
			this.save();
			lastSave = new Date().getTime();
			this.addToLog('[AutoSave] Game saved.', 'gray');
		}
	};

	this.save = function() {
		//this.storage.save('map', this.map.getData());
		this.storage.save('stats', stats);
		this.storage.save('position', position);
		this.storage.save('controls', controls);
	};

	this.load = function() {
		for(var stat in defaultStats) {
			this.addStat(stat, defaultStats[stat]);
		}
		//var map = this.storage.load('map', undefined);
		//this.map = defaultMap;
		stats = this.storage.load('stats', stats);
		position = this.storage.load('position', position);
		controls = this.storage.load('controls', controls);
	};

	this.registerEvents = function() {
		$('body').on('keydown', function(e) {
			game.onKeyDown(e);
		});

		$map.on('mouseover', 'span[data-description]', function() {
			game.renderDescription($(this));
		}).on('mouseout', 'span[data-description]', function() {
				game.hideDescription();
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
				game.clearLog();
			} else if(action === 'controls') {
				game.showModal('controls');
			} else if(action === 'save') {
				game.save();
				game.addToLog('Game saved.', 'gray');
			}
		});

		$modal.on('click', '.modal-close', function() {
			game.hideModal();
		});

		$modal.on('click', '[data-response]', function() {
			game.respond($(this).data('response'));
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
		this.renderStats();
		this.registerEvents();
		this.renderMap();
	};
}

function MapManager(entityManager, $map, $position) {
	entityManager.addEntityType('empty space');
	var emptyEntity = entityManager.createEntity('empty space');
	var maps = {};
	var current = undefined;

	this.createMap = function() {
		var map = new Map(entityManager, $map, $position);
		map.emptyEntity = emptyEntity;
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
	this.emptyEntity = {};

	function createKey(x, y) {
		return x + '|' + y;
	}

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
		entities[createKey(x, y)] = entityManager.createEntity(name, data);
	};

	this.fromArray = function(x, y, array, types, data) {
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
		var position = {x: x, y: y};
		x = position.x - 31;
		y = position.y - 15;
		var map = '';
		while(y < position.y + 15) {
			while(x < position.x + 31) {
				if(y == position.y && x == position.x) {
					map += '<span data-description="you' + ' (' + x + '|' + y + ')" style="color: green">@</span>';
				} else {
					var entity = this.getEntity(x, y);
					var char = entity.getChar();
					var c = entity.getColor();
					var description = entity.getName() + ' (' + x + '|' + y + ')';
					map += '<span data-description="' + description + '" style="color: ' + c + '">' + char + '</span>';
				}
				x++;
			}
			map += '\n';
			x = position.x - 31;
			y++;
		}
		$map.html(map);
		$position.html('(' + position.x + '|' + position.y + ') - ' + this.getEntity(position.x, position.y).getName());
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
		if(typeof defaultData[name] === 'undefined') {
			defaultData.name = name;
		}
		types[name] = {
			defaultMethods: defaultMethods,
			defaultData: defaultData
		};
	};

	this.createEntity = function(name, data) {
		if(!(name in types)) {
			return {};
		}
		if(typeof data === 'undefined') {
			data = {};
		}
		var entityType = types[name];
		var entity = new Entity();

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
}

function Entity() {
	var data = {};
	var defaultData = {
		passable: true,
		dynamic: false,
		color: 'transparent',
		char: ' ',
		name: 'empty space'
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

	this.isPassable = function() {
		return this.getData('passable', defaultData.passable);
	};

	this.isDynamic = function() {
		return this.getData('dynamic', defaultData.dynamic);
	};

	this.getColor = function() {
		return this.getData('color', defaultData.color);
	};

	this.getChar = function() {
		return this.getData('char', defaultData.char);
	};

	this.getName = function() {
		return this.getData('name', defaultData.name);
	};

	this.getPosition = function() {
		return this.getData('position', undefined);
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
