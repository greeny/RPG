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

function Game(defaultMap) {
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
	var lastSave = new Date().getTime();
	var $map = $('#map'), $position = $('#position'), $log = $('#log'), $menu = $('#menu'), $modal = $('#modal'), $stats = $('#stats');

	this.saveInterval = 1000 * 30;

	this.storage = new DataStorage();

	this.renderMap = function() {
		var x = position.x - 31, y = position.y - 15, map = '';
		while(y < position.y + 15) {
			while(x < position.x + 31) {
				if(y == position.y && x == position.x) {
					map += '<span data-description="you' + ' (' + x + '|' + y + ')" style="color: green">@</span>';
				} else {
					var point = this.map.getPoint(x, y);
					var char = point.getChar();
					var c = point.getColor();
					var description = point.getDescription() + ' (' + x + '|' + y + ')';
					map += '<span data-description="' + description + '" style="color: ' + c + '">' + char + '</span>';
				}
				x++;
			}
			map += '\n';
			x = position.x - 31;
			y++;
		}
		$map.html(map);
		$position.html('(' + position.x + '|' + position.y + ') - ' + this.map.getPoint(position.x, position.y).getDescription());
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

		if(modalOpened !== '') {
			if(modalOpened === 'controls' && this.getModalMode() !== '') {
				this.setControl(this.getModalMode(), e.keyCode);
				this.setModalMode('');
				this.showModal('controls');
				e.preventDefault();
				return;
			} else if(action === 'cancel') {
				this.hideModal();
				this.setModalMode('');
				this.stopTimedAction();
				e.preventDefault();
			} else if(modalOpened === 'speech' && this.getModalMode() === 'close') {
				this.setModalMode('');
				this.hideModal();
				e.preventDefault();
				return;
			} else if(modalOpened === 'speech' && typeof this.getModalMode() === 'object') {
				this.showModal('response', this.getModalMode());
				e.preventDefault();
			} else if(modalOpened === 'response') {
				if(action === 'answer1') {
					this.respond(0);
					e.preventDefault();
				} else if(action === 'answer2') {
					this.respond(1);
					e.preventDefault();
				} else if(action === 'answer3') {
					this.respond(2);
					e.preventDefault();
				}
			}
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
			this.map.getPoint(position.x, position.y).onInteract();
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
		var point = this.map.getPoint(n.x, n.y);
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
			$content.html( 'CONTROLS\n' +
				'========\n' +
				'Move up    | <span data-control="up">' + keyMapping[this.getKeyByAction('up')] + '</span>\n' +
				'Move down  | <span data-control="down">' + keyMapping[this.getKeyByAction('down')] + '</span>\n' +
				'Move left  | <span data-control="left">' + keyMapping[this.getKeyByAction('left')] + '</span>\n' +
				'Move right | <span data-control="right">' + keyMapping[this.getKeyByAction('right')] + '</span>\n' +
				'Interact   | <span data-control="interact">' + keyMapping[this.getKeyByAction('interact')] + '</span>\n' +
				'Answer 1   | <span data-control="answer1">' + keyMapping[this.getKeyByAction('answer1')] + '</span>\n' +
				'Answer 2   | <span data-control="answer2">' + keyMapping[this.getKeyByAction('answer2')] + '</span>\n' +
				'Answer 3   | <span data-control="answer3">' + keyMapping[this.getKeyByAction('answer3')] + '</span>\n' +
				'Cancel     | <span data-control="cancel">' + keyMapping[this.getKeyByAction('cancel')] + '</span>\n' +
				'\n<span style="color: gray">Click a key to edit it.</span>'
			);
		} else if(type === 'speech') {
			var nick = data.nick;
			var text = data.text;
			var responses = data.responses;
			var callback = data.callback;
			if(typeof callback === 'function') {
				callback();
			}
			this.addToLog('[' + nick + '] ' + text);
			if(typeof responses !== 'undefined' && Array.size(responses) > 0) {
				$content.html('[' + nick + ']\n\n' + text + '\n\n\n  <span style="color: gray">Press any key to respond.</span>');
				this.setModalMode(responses);
			} else {
				$content.html('[' + nick + ']\n\n' + text + '\n\n\n  <span style="color: gray">Press any key to close.</span>');
				this.setModalMode('close');
			}
		} else if(type === 'response') {
			var content = '<span style="color: gray">Select your response:</span>\n';
			for(var i in data) {
				content += '\n<span data-response="' + i + '">' + (Number(i) + 1) + '. ' + data[i].text + '</span>';
			}
			$content.html(content);
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
		if(modalOpened !== 'response') {
			return;
		}
		var mode = this.getModalMode()[response];
		this.addToLog('[You] ' + mode.text);
		if(typeof mode.modal !== 'undefined') {
			this.showModal('speech', mode.modal);
		}
		if(typeof mode.callback !== 'undefined') {
			mode.callback();
		}
	};

	this.setModalMode = function(mode) {
		modalMode = mode;
	};

	this.getModalMode = function() {
		return modalMode;
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
		this.storage.save('map', this.map.getData());
		this.storage.save('stats', stats);
		this.storage.save('position', position);
		this.storage.save('controls', controls);
	};

	this.load = function() {
		for(var stat in defaultStats) {
			this.addStat(stat, defaultStats[stat]);
		}
		var map = this.storage.load('map', undefined);
		/*if(typeof map === 'undefined') {
			this.map = defaultMap;
		} else {
			this.map = new Map();
			this.map.setData(map);
		}*/ // TODO FIX SAVING AND LOADING OF MAP - there should be no callbacks
		this.map = defaultMap;
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
			game.setModalMode($self.data('control'));
			$self.text('<press a key>').addClass('choosing');
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

function Map() {
	var map = {};
	var points = {};

	function getEmptyPoint() {
		return {
			'isDynamic': function() {return false},
			'isPassable': function() {return true},
			'onCollide': function() {},
			'onInteract': function() {},
			'getChar': function() {return ' '},
			'getColor': function() {return 'transparent'},
			'getDescription': function() {return 'empty point'}
		}
	}

	function getWallPoint() {
		return {
			'isDynamic': function() {return false},
			'isPassable': function() {return false},
			'onCollide': function() {},
			'onInteract': function() {},
			'getChar': function() {return '#'},
			'getColor': function() {return 'gray'},
			'getDescription': function() {return 'wall'}
		}
	}

	this.definePoint = function(name, point) {
		if(name !== 'wall') {
			points[name] = point;
		}
	};

	this.setPoint = function(x, y, point) {
		if(typeof point === 'string') {
			if(point in points) {
				point = points[point];
			} else if(point !== 'wall') {
				return;
			}
		}
		if(!(x in map)) {
			map[x] = {};
		}
		map[x][y] = point;
	};

	this.getPoint = function(x, y) {
		if(!(x in map)) {
			map[x] = {};
		}
		if(!(y in map[x])) {
			return getEmptyPoint();
		} else {
			var point =  map[x][y];
			if(point === 'wall') {
				return getWallPoint();
			} else {
				return point;
			}
		}
	};

	this.fromArray = function(x, y, array, types) {
		for(var i in array) {
			for(var j in array[i]) {
				var point = array[j][i];
				if(point !== ' ') {
					this.setPoint(x+Number(i), y+Number(j), types[point]);
				}
			}
		}
	};

	this.getData = function() {
		return {
			map: map,
			points: points
		};
	};

	this.setData = function(data) {
		map = data['map'];
		points = data['points'];
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
