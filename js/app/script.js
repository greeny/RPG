function dump(what) {
	console.log(what);
	console.trace();
	return what;
}

Array.size = function(arr) {
	var size = 0, key;
	for(key in arr) {
		if(arr.hasOwnProperty(key)) size++;
	}
	return size;
};

String.ucfirst = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

$.fn.extend(
	{
		redraw: function(){
			return $(this).each(function(){
				var redraw = this.offsetHeight;
			});
		}
	}
);

function Logger() {}

Logger.log = function(who, message, color, whoColor) {
	if(typeof color === 'undefined') {
		color = 'white';
	}
	if(typeof whoColor === 'undefined') {
		whoColor = 'gray';
	}
	$('#log').append(
		$('<div class="log-message"></div>').html('[<span style="color: ' + whoColor + '">' + who +
			'</span>] <span style="color: ' + color + '">' + message + '</span>')
	).scrollTop(1e10);
};

Logger.clear = function() {
	$('#log').html('');
};

function Game() {
	var items = {};
	var quests = {};
	var actionCounter = 0;
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
		autoSaveMessage: true,
		showGrid: true,
		saveBeforeClose: true
	};
	var stats = {};
	var modalOpened = 'none', modalMode = '', timedAction = undefined;
	var speechEntity = undefined, speechData = {};
	var lastSave = new Date().getTime();
	var $map = $('#map'), $menu = $('#menu'), $modal = $('#modal'), $inventoryMenu = $('#inventory-menu'), $inventory = $('#inventory'),
		$stats = $('#stats'), $modalContent = $('#modal-content');

	var entityManager = new EntityManager();
	var mapManager = new MapManager(entityManager);

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

	this.getPosition = function() {
		return this.getPlayer().getPosition();
	};

	this.addItem = function(name, item) {
		if(typeof item.name === 'undefined') {
			item.name = name;
		}
		items[name] = item;
	};

	this.getItem = function(name) {
		return items[name];
	};

	this.addQuest = function(name, data) {
		quests[name] = data;
	};

	this.getQuest = function(name) {
		return quests[name];
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

		if(typeof action !== 'undefined') {
			e.preventDefault();
		} else {
			return;
		}

		if(!this.canAct()) {
			return;
		}
		if(action === 'left' || action === 'right' || action === 'up' || action === 'down') {
			this.getPlayer().move(action);
		} else if(action === 'interact') {
			var p = this.getPlayer().getPosition(), entity = this.getMap().getEntity(p.x, p.y);
			entity.onInteract();
			if(entity.isEnemy()) {
				entity.onAttack();
				this.onAttack(entity);
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
				'<span data-settings="showGrid">' + (settings.showGrid ? '[*]' : '[ ]') + ' Show map grid.</span><br>' +
				'<span data-settings="saveBeforeClose">' + (settings.saveBeforeClose ? '[*]' : '[ ]') + ' Save game before leaving page.</span><br>' +
				'<br>' +
				'<span data-settings="reset" style="color: red">Reset game</span>'
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
		Logger.log('You', data.text, 'gray', 'green');
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
		if(typeof speech.text !== 'undefined') {
			var name = entity.getName(), text = speech.text;
			Logger.log(name, text, 'gray', entity.getColor());
			if(typeof speechData.responses !== 'undefined' && Array.size(speechData.responses)) {
				var content = '[<span style="color: ' + entity.getColor() + '">' + name + '</span>]<br><br>' + text + '<br><br><br><span style="color: gray">Select your response:</span><br><br>';
				for(var i in speechData.responses) {
					content += '&nbsp;&nbsp;<span data-response="' + i + '">' + (Number(i) + 1) + '. ' + speechData.responses[i].text + '</span><br>';
				}
				$modalContent.html(content)
			} else {
				$modalContent.html('[<span style="color: ' + entity.getColor() + '">' + name + '</span>]<br><br>' + text + '<br><br><br>&nbsp;&nbsp;<span style="color: gray">Press any key to close.</span>');
			}
		}
		if(typeof speech.callback !== 'undefined') {
			speech.callback(entity);
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
			timedAction = {title: title, start: $.now(), finish: $.now() + time, callback: callback};
			this.showModal('timed', timedAction);
		}
	};

	this.stopTimedAction = function() {
		timedAction = undefined;
	};

	this.onAttack = function(entity) {
		var pDamage, eDamage, attXp = 1, defXp = 1;

		while(this.getPlayer().getCurrentHp() !== 0 && entity.getCurrentHp() !== 0) {
			pDamage = entity.damage(this.getPlayer().getStatWithBonuses('attack') - entity.getDefence());
			eDamage = this.getPlayer().damage(entity.getAttack() - this.getPlayer().getStatWithBonuses('defence'));
			Logger.log('FIGHT', 'You have dealt ' + pDamage + ' damage to ' + entity.getName() + '.', 'green', 'red');
			Logger.log('FIGHT', entity.getName() + ' has dealt ' + eDamage + ' damage to you.', 'red', 'red');
			attXp += pDamage / 10;
			defXp += eDamage / 10;
		}
		if(this.getPlayer().getCurrentHp() === 0) {
			Logger.log('FIGHT', 'You have been killed by ' + entity.getName() + '.', 'red', 'red');
			Logger.log('INFO', 'You got another chance to start from begining.', 'red', 'gray');
			this.reset();
		} else {
			var position = entity.getPosition(), drop = entity.getDrop();
			Logger.log('FIGHT', 'You have killed ' + entity.getName() + '.', 'green', 'red');
			this.getMap().setEntity(position.x, position.y, 'empty space');
			this.getRenderer().renderPoints(this.getMap(), [position], this.getPosition());
			this.getPlayer().addXp('attack', attXp);
			this.getPlayer().addXp('defence', defXp);
			if(typeof drop.items !== 'undefined') {
				for(var k in drop.items) {
					if(Math.random() * 100 <= drop.items[k])
						this.getPlayer().addItem(k, 1);
				}
			}
			if(typeof drop.gold !== 'undefined') {
				this.getPlayer().addGold(drop.gold);
			}
		}
	};

	this.getSettings = function() {
		return settings;
	};

	this.toggleSettings = function(key) {
		if(settings[key] === 'undefined') {
			settings[key] = true;
		}
		if(key === 'reset') {
			this.reset();
			Logger.log('INFO', 'Game was has been restarted.', 'red', 'gray');
			return;
		}
		settings[key] = !settings[key];
		if(key === 'showGrid') {
			if(settings[key]) {
				$map.addClass('grid');
			} else {
				$map.removeClass('grid');
			}
		}
		this.showModal('settings');
	};

	this.reset = function() {
		this.storage.clean();
		player = new Player(this);
		this.load();
		this.save();
		this.getRenderer().renderFullMap(this.getMap(), this.getPlayer().getPosition());
		this.getPlayer().renderStats();
	};

	this.onInventoryMenuClick = function(action) {
		if(action === 'inventory') {
			this.getRenderer().renderInventory(this.getPlayer().getItems());
		} else if(action === 'equip') {
			this.getRenderer().renderEquip(this.getPlayer().getEquippedItems());
		} else if(action === 'quests') {
			this.getRenderer().renderQuests(this.getPlayer().getActiveQuests(), this.getPlayer().getCompletedQuests());
		}
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
		var maps = this.getMapManager().getMaps(), mapData = {};
		for(var k in maps) {
			mapData[k] = maps[k].getSaveData();
		}
		this.storage.save('maps', mapData);
		this.storage.save('player', this.getPlayer().getSaveData());
		this.storage.save('controls', controls);
		this.storage.save('settings', settings);
	};

	this.load = function() {
		var mapData = this.storage.load('mapData', {});
		for(var k in mapData) {
			this.getMapManager().getMap(k).setSaveData(mapData[k]);
		}
		this.getPlayer().setSaveData(this.storage.load('player', this.getPlayer().getSaveData()));
		controls = this.storage.load('controls', controls);
		settings = this.storage.load('settings', settings);
		if(settings.showGrid) {
			$map.addClass('grid');
		}
	};

	this.registerEvents = function() {
		$('body').on('keydown', function(e) {
			game.onKeyDown(e);
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

		$inventoryMenu.on('click', 'span.menu-item', function() {
			if(!game.canAct()) {
				return;
			}
			var action = $(this).data('action');
			game.getRenderer().renderInventoryMenu(action);
			game.onInventoryMenuClick(action);
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

		$inventory.on('click', '[data-equip]', function() {
			game.getPlayer().equip($(this).data('equip'));
		});

		$inventory.on('click', '[data-unequip]', function() {
			game.getPlayer().unequip($(this).data('unequip'));
		});

		var drag = false, lastX, lastY;

		$('#map-outer').on('mousedown', function(e) {
			if(e.which !== 1) return;
			drag = true;
			lastX = e.pageX;
			lastY = e.pageY;
			$(this).css('cursor', 'move');
			e.preventDefault();
		}).on('mouseup', function(e) {
			if(e.which !== 1) return;
			drag = false;
			$(this).css('cursor', 'pointer');
			e.preventDefault();
		}).on('mousemove', function(e) {
			if(drag) {
				var x = (lastX - e.pageX), y = (lastY - e.pageY);
				lastX = e.pageX;
				lastY = e.pageY;
				var $map = $(this).find('#map');
				$map.css('left', '-=' + x);
				$map.css('top', '-=' + y);
				e.preventDefault();
			}
		});

		$(window).on('unload', function() {
			if(game.getSettings().saveBeforeClose) {
				game.save();
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
		this.getRenderer().renderFullMap(this.getMap(), this.getPosition());
		this.getPlayer().onStart();
		this.onInventoryMenuClick('inventory');
	};
}

function Player(game) {
	var currentHp = 10, maxHp = 10;
	var position = {x: 0, y: 0};
	var gold = 0;
	var stats = {};
	var inventory = {};
	var equip = {};
	var activeQuests = {};
	var completedQuests = {};
	var defaultStats = {
		attack: 'Attack',
		defence: 'Defence',
		speed: 'Speed'
	};

	this.getPosition = function() {
		return position;
	};

	this.renderStats = function() {
		game.getRenderer().renderStats({
			currentHp: currentHp,
			maxHp: maxHp,
			stats: stats
		});
	};

	this.addItem = function(name, count, message) {
		if(typeof count === 'undefined') {
			count = 1;
		}
		if(typeof message === 'undefined') {
			message = true;
		}
		var item = this.getItem(name);
		if(typeof item === 'undefined') {
			item = new Item(game.getItem(name), count);
			inventory[name] = item;
		} else {
			item.addCount(count);
		}
		game.getRenderer().renderInventory(this.getItems());
		if(message) {
			if(count === 1) {
				Logger.log('INFO', 'You received ' + item.getName() + '.', 'yellow');
			} else {
				Logger.log('INFO', 'You received ' + item.getCount() + '&times ' + item.getName() + '.', 'yellow');
			}
		}
	};

	this.getItem = function(name) {
		return inventory[name];
	};

	this.getItems = function() {
		return inventory;
	};

	this.getEquippedItems = function() {
		var ret = {};
		for(var k in equip) {
			ret[k] = this.getItem(equip[k]);
		}
		return ret;
	};

	this.hasEquipped = function(item) {
		for(var k in equip) {
			if(equip[k] === item) {
				return true;
			}
		}
		return false;
	};

	this.equip = function(itemName) {
		var item = this.getItem(itemName);
		equip[item.getEquipPlace()] = itemName;
		game.getRenderer().renderInventory(this.getItems());
	};

	this.unequip = function(location) {
		equip[location] = undefined;
		game.getRenderer().renderEquip(this.getEquippedItems());
	};

	this.hasItem = function(name, count) {
		var item = this.getItem(name);
		if(typeof item === 'undefined') {
			return false;
		}
		if(typeof count === 'undefined') {
			return true;
		}
		return count <= item.getCount();
	};

	this.removeItem = function(name, count) {
		var item = this.getItem(name);
		if(typeof count === 'undefined' || count >= item.getCount()) {
			delete inventory[name];
			// TODO remove from equip if present
		} else {
			item.addCount(-count);
		}
		game.getRenderer().renderInventory(this.getItems());
	};

	this.addQuest = function(name) {
		activeQuests[name] = new Quest(game.getQuest(name));
		Logger.log('INFO', 'You received new quest: ' + activeQuests[name].getName() + '.', 'yellow');
		game.getRenderer().renderQuests(this.getActiveQuests(), this.getCompletedQuests());
	};

	this.getQuest = function(name) {
		return activeQuests[name];
	};

	this.hasQuest = function(name) {
		return (this.getQuest(name) !== undefined);
	};

	this.getActiveQuests = function() {
		return activeQuests;
	};

	this.getCompletedQuests = function() {
		return completedQuests;
	};

	this.setQuestStatus = function(name, status) {
		var quest = this.getQuest(name);
		Logger.log('INFO', 'One of your quests was updated (' + quest.getName() + ').', 'yellow');
		quest.setStatus(status);
	};

	this.getQuestStatus = function(name) {
		return this.getQuest(name).getStatus();
	};

	this.completeQuest = function(name) {
		var quest = this.getQuest(name);
		quest.complete();
		Logger.log('INFO', 'You have completed quest: ' + quest.getName() + '.', 'yellow');
		completedQuests[name] = activeQuests[name];
		delete activeQuests[name];
	};

	this.getCurrentHp = function() {
		return ~~currentHp;
	};

	this.getGold = function() {
		return gold;
	};

	this.addGold = function(value) {
		Logger.log('INFO', 'You received ' + value + ' gold.', 'yellow', 'gray');
		gold += value;
		game.getRenderer().renderGold(gold);
	};

	this.setCurrentHp = function(value) {
		var delta = currentHp - this.getCurrentHp();
		currentHp = value + delta;
		this.renderStats();
	};

	this.getMaxHp = function() {
		return maxHp;
	};

	this.damage = function(value) {
		var c = this.getCurrentHp();
		if(value < 0) value = 0;
		currentHp -= value;
		this.renderStats();
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
			this.renderStats();
		}
	};

	this.getStat = function(name) {
		return stats[name];
	};

	this.getStats = function() {
		return stats;
	};

	this.getStatWithBonuses = function(name) {
		var stat = this.getStat(name).level;
		for(var k in inventory) {
			stat += inventory[k].getStatBonus(name);
		}
		return stat;
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
			this.renderStats();
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
		var point = game.getMap().getEntity(n.x, n.y);
		if(point.isPassable() && !game.getMap().isOutOfBorder(n.x, n.y)) {
			game.getRenderer().renderPoints(game.getMap(), [
				{x: position.x, y: position.y},
				{x: n.x, y: n.y}
			], n);
			position = n;
			point.onCollide();
			if(point.isEnemy() && point.isAggressive()) {
				point.onAttack();
				game.onAttack(point);
			}
		}
	};

	this.getSaveData = function() {
		var inv = {};
		for(var k in inventory) {
			inv[k] = inventory[k].getCount();
		}
		return {
			currentHp: currentHp,
			maxHp: maxHp,
			stats: stats,
			inventory: inv,
			position: position,
			gold: gold,
			equip: equip
		};
	};

	this.setSaveData = function(data) {
		gold = data.gold ? data.gold : 0;
		currentHp = data.currentHp ? data.currentHp : 10;
		maxHp = data.maxHp ? data.maxHp : 10;
		stats = data.stats ? data.stats : {};
		position = data.position ? data.position : {x: 0, y: 0};
		equip = data.equip ? data.equip : {};
		for(var k in data.inventory) {
			this.addItem(k, data.inventory[k], false);
		}
	};

	this.onStart = function() {
		this.renderStats();
		game.getRenderer().renderGold(gold);
	};

	for(var k in defaultStats) {
		this.addStat(k, defaultStats[k], false);
	}
}

function Item(data, count) {
	var defaultData = {
		stats: {},
		name: 'Unnamed item',
		description: 'Does nothing',
		type: 'other',
		favor: undefined,
		count: 1,
		equip: undefined
	};

	if(typeof data === 'undefined') {
		data = {};
	}

	this.getData = function(key, def) {
		if(typeof data[key] !== 'undefined') {
			return data[key];
		} else {
			return def;
		}
	};

	this.setData = function(key, value) {
		data[key] = value;
	};

	this.getName = function() {
		return this.getData('name', defaultData.name);
	};

	this.getDescription = function() {
		return this.getData('description', defaultData.description);
	};

	this.getType = function() {
		return this.getData('type', defaultData.type);
	};

	this.getFavor = function() {
		return this.getData('favor', defaultData.favor);
	};

	this.getCount = function() {
		return this.getData('count', defaultData.count);
	};

	this.addCount = function(count) {
		this.setData('count', this.getData('count', defaultData.count) + count);
	};

	this.isEquippable = function() {
		return this.getData('equip', defaultData.equip) !== undefined;
	};

	this.getEquipPlace = function() {
		return this.getData('equip', defaultData.equip);
	};

	this.getStatBonus = function(stat) {
		var stats = this.getData('stats', defaultData.stats);
		if(typeof stats[stat] !== 'undefined') {
			return stats[stat];
		} else {
			return 0;
		}
	};

	this.getStatsBonus = function() {
		return this.getData('stats', defaultData.stats);
	};

	if(typeof count === 'undefined') {
		count = 1;
	}
	this.setData('count', count);
}

function Quest(data) {
	var defaultData = {
		name: 'Unnamed quest',
		description: '',
		status: 0,
		completed: false
	};
	if(typeof data === 'undefined') {
		data = {};
	}

	this.setData = function(key, value) {
		data[key] = value;
	};

	this.getData = function(key, def) {
		if(typeof data[key] !== 'undefined') {
			return data[key];
		} else {
			return def;
		}
	};

	this.getName = function() {
		return this.getData('name', defaultData.name);
	};

	this.getStatus = function() {
		return this.getData('status', defaultData.status);
	};

	this.setStatus = function(status) {
		this.setData('status', status);
	};

	this.getDescription = function() {
		return this.getData('description', defaultData.description);
	};

	this.isCompleted = function() {
		return this.getData('completed', defaultData.completed);
	};

	this.complete = function() {
		this.setData('completed', true);
		this.onComplete();
	};

	this.onComplete = function() {

	};
}

function MapManager(entityManager) {
	var maps = {};
	var current = undefined;

	function getEmptyEntity(map) {
		return entityManager.createEntity(map, 'empty space')
	}

	this.createMap = function() {
		var map = new Map(entityManager);
		map.emptyEntity = getEmptyEntity(map);
		return map;
	};

	this.addMap = function(name, map) {
		maps[name] = map;
	};

	this.setCurrentMap = function(name, render) {
		if(name in maps) {
			current = name;
		}
		if(typeof render !== 'undefined' && render) {
			game.getRenderer().renderFullMap(this.getCurrentMap(), game.getPosition());
		}
	};

	this.getMaps = function() {
		return maps;
	};

	this.getMap = function(name) {
		return maps[name];
	};

	this.getCurrentMap = function() {
		if(typeof current !== 'undefined') {
			return maps[current];
		} else {
			return undefined;
		}
	};
}

function Map(entityManager) {
	var entities = {};
	var dynamicEntities = {};
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
		} else {
			delete dynamicEntities[key];
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

	this.onTick = function() {
		for(var key in dynamicEntities) {
			entities[key].onAction();
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
		},
		drop: {
			gold: 0,
			items: {}
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
		dump(saveData);
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

	this.getDrop = function() {
		return this.getData('drop', defaultData.drop);
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

	this.onDrop = function() {

	};
}

function Renderer() {
	var $stats = $('#stats'),
		$map = $('#map-border'),
		$mapLoading = $('#block'),
		$detail = $('#tile-detail'),
		$inventory = $('#inventory'),
		$inventoryMenu = $('#inventory-menu'),
		$gold = $('#gold');

	function renderEntity($tile, entity) {
		var position = entity.getPosition();
		$tile.css('color', entity.getColor())
			.html(entity.getChar())
			.append('<div class="description">' + entity.getName() + ' (' + position.x + '|' + position.y + ')</div>');
	}

	function getMapTile(x, y, borderTop, borderLeft) {
		var data = x + '|' + y;
		var tile = $map.find('[data-tile="' + data + '"]');
		if(tile.length < 1) {
			$map.append('<span class="tile" data-description data-tile="' + data + '" style="left: ' +
				(x - borderLeft) * 13 + 'px; top: ' + (y - borderTop) * 21 + 'px;">' +
				'<span class="description">(' + x + '|' + y + ')</span></span>');
			tile = $map.find('[data-tile="' + data + '"]');
		}
		return tile;
	}

	function getItemDescription(item) {
		var description = item.getName() + '<br>' + item.getType() + '<br><br>' + item.getDescription() + '<br>',
			favor = item.getFavor(),
			bonuses = item.getStatsBonus();
		for(var k in bonuses) {
			description += '<br>&nbsp;+' + bonuses[k] + ' ' + k;
		}
		if(typeof favor !== 'undefined') {
			description += '<br><br><span class="favor">' + favor + '</span>';
		}
		return description;
	}

	function getQuestDescription(quest) {
		return quest.getDescription();
	}

	this.renderGold = function(value) {
		$gold.html(value);
	};

	this.renderStats = function (data) {
		var $bar = $stats.find('[data-stats="hp"]');
		if($bar.length < 1) {
			$stats.append(
				$('<div class="bar health" data-stats="hp"></div>').append(
						$('<div class="bar-title"></div>').html('0/10 HP')
					).append(
						$('<div class="bar-inner"></div>').css('width', '0%')
					)
			);
			$bar = $stats.find('[data-stats="hp"]');
		}

		var current = data.currentHp, max = data.maxHp;

		$bar.find('.bar-title').html(current + '/' + max + ' HP');
		$bar.find('.bar-inner').css('width', String(current / max * 100) + '%');

		for(var k in data.stats) {
			var stat = data.stats[k];
			var description = stat.title + ' level ' + stat.level + ' (' + stat.xp + '/' + (stat.level * 10) + ' xp)';

			$bar = $stats.find('[data-stats="' + k + '"]');
			if($bar.length < 1) {
				$stats.append(
					$('<div class="bar" data-stats="' + k + '" data-description></div>').append(
							$('<div class="bar-title"></div>').html(stat.title + ' level ' + stat.level)
						).append(
							$('<div class="bar-inner"></div>').css('width', String(stat.xp / (stat.level * 10) * 100) + '%')
						).append('<div class="description">' + description + '</div>')
				);
				$bar = $stats.find('[data-stats="' + k + '"]');
			}

			$bar.find('.description').html(description);
			$bar.find('.bar-title').html(stat.title + ' level ' + stat.level);
			$bar.find('.bar-inner').css('width', String(stat.xp / (stat.level * 10) * 100) + '%');
		}
	};

	this.renderFullMap = function(map, position) {
		$mapLoading.show();
		var border = map.getBorder(), x = border.left, y = border.top, tx = x, ty = y, $tile, entity,
			$progress = $('#block-inner'), tiles = (border.right - border.left + 1) * (border.bottom - border.top + 1), count = 0;
		while(ty <= border.bottom) {
			while(tx <= border.right) {
				(function(tx, ty) { // TODO FIX MAP LOADING, make it display nice bar, etc. also timer shall be made better
					setTimeout(function() {
						$tile = getMapTile(tx, ty, border.top, border.left);
						entity = map.getEntity(tx, ty);
						if(tx === position.x && ty === position.y) {
							$tile.css('color', 'green').html('@').append('<div class="description">You (' + tx + '|' + ty + ')</div>');
							$detail.html(entity.getName() + ' (' + position.x + '|' + position.y + ')');
						} else {
							renderEntity($tile, entity);
						}
						$progress.html('Loading map... ' + ' ' + ~~Number((++count/tiles)*100) + '%');
						if(count === tiles) {
							$mapLoading.hide();
						}
					}, Math.min(x + y, 100));
				})(tx, ty);
				tx++;
			}
			ty++;
			tx = x;
		}
		$map
			.css('top', (border.top + 15) * 21)
			.css('left', (border.left + 32) * 13)
			.css('bottom', (-border.bottom + 13) * 21 + 4)
			.css('right', (-border.right + 30) * 13 - 1);
	};

	this.renderPoints = function(map, points, position) {
		var border = map.getBorder();
		for(var k in points) {
			var entity = points[k];
			var $tile = getMapTile(entity.x, entity.y, border.top, border.left);
			if(position.x === entity.x && position.y === entity.y) {
				$tile.css('color', 'green').html('@').append('<div class="description">You (' + entity.x + '|' + entity.y + ')</div>');
				$detail.html(map.getEntity(entity.x, entity.y).getName() + ' (' + position.x + '|' + position.y + ')');
			} else {
				renderEntity($tile, map.getEntity(entity.x, entity.y));
			}
		}
	};

	this.renderInventoryMenu = function(activeItem) {
		$inventoryMenu.find('.menu-item').removeClass('active');
		$inventoryMenu.find('[data-action="' + activeItem + '"]').addClass('active');
	};

	this.renderInventory = function(items) {
		this.renderInventoryMenu('inventory');
		var content = '<table class="inventory-table">';
		for(var k in items) {
			var item = items[k],
				equip = '';
			if(item.isEquippable()) {
				if(game.getPlayer().hasEquipped(item.getName())) {
					equip = '<td><span style="color: green">Equipped (' + item.getEquipPlace() + ')</span></td>';
				} else {
					equip = '<td><span data-equip="' + item.getName() + '">Equip (' + item.getEquipPlace() + ')</span></td>';
				}
			} else {
				equip = '<td><span style="color: red">Not equippable</span></td>';
			}
			content += '<tr>' +
				'<td>' + item.getCount() + '&times;</td>' +
				'<td><span class="item" data-description>' + item.getName() +
				'<span class="description">' + getItemDescription(item) +'</span></span></td>' + equip + '</tr>';
		}
		content += '</table>';
		$inventory.html(content);
	};

	this.renderEquip = function(items) {
		this.renderInventoryMenu('equip');
		var equip = {}, positions = ['head', 'necklace', 'gloves', 'ring', 'left hand', 'right hand', 'body', 'legs', 'foot'], item;
		for(var k in positions) {
			k = positions[k];
			if(typeof items[k] !== 'undefined') {
				item = '<span style="color: green">o</span><span class="description">' + String.ucfirst(k) + '<br><br>' + getItemDescription(items[k]) + '</span>';
			} else {
				item = '<span style="color: yellow">o</span><span class="description">' + String.ucfirst(k) + '</span>';
			}
			equip[k] = '<span data-unequip="' + k + '" data-description>' + item + '</span>';
		}

		var content = '' + // COOL ASCII FIGURE
			'&nbsp;&nbsp;&nbsp;&nbsp;_<br>' +
			'&nbsp;&nbsp;&nbsp;/' + equip['head'] + '\\<br>' +
			'&nbsp;&nbsp;&nbsp;\\_/<br>' +
			'&nbsp;&nbsp;/|' + equip['necklace'] + '|\\<br>' +
			equip['gloves'] + '/&nbsp;|' + equip['body'] + '|&nbsp;\\' + equip['ring'] + '<br>' +
			equip['left hand'] + '&nbsp;&nbsp;|&nbsp;|&nbsp;&nbsp;' + equip['right hand'] + '<br>' +
			'&nbsp;&nbsp;&nbsp;|_|<br>' +
			'&nbsp;&nbsp;&nbsp;/&nbsp;\\<br>' +
			'&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;' + equip['legs'] + '<br>' +
			'&nbsp;' + equip['foot'] + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\\<br><br>' +
			'<span style="color: gray">Click a position to unequip item.</span>';

		$inventory.html(content);
	};

	this.renderQuests = function(active, completed) {
		this.renderInventoryMenu('quests');
		var content = '<b>Active quests:</b><br><br>';
		for(var k in active) {
			content += '<span style="color: yellow" data-description>' + active[k].getName() + '' +
				'<span class="description">' + getQuestDescription(active[k]) + '</span></span><br>';
		}

		content += '<br><b>Completed quests:</b><br><br>'

		for(k in completed) {
			content += '<span style="color: green" data-description>' + completed[k].getName() + '' +
				'<span class="description">' + getQuestDescription(completed[k]) + '</span></span><br>';
		}

		$inventory.html(content);
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

	this.clean = function() {
		saveKey('data', {});
	};
}

game = new Game();
