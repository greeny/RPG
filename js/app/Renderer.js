function Renderer() {
	var $stats = $('#stats'), $map = $('#map-border'), $detail = $('#tile-detail');

	var lastRenderData = {};

	function getLastRenderData(key) {
		if(typeof lastRenderData[key] === 'undefined') {
			lastRenderData[key] = {};
		}
		return lastRenderData[key];
	}

	function renderEntity($tile, entity) {
		var position = entity.getPosition();
		$tile.css('color', entity.getColor())
			.html(entity.getChar())
			.append('<div class="description">' + entity.getName() + ' (' + position.x + '|' + position.y + ')</div>');
	}

	function setLastRenderData(key, value) {
		lastRenderData[key] = value;
	}

	function getMapTile(x, y, borderTop, borderLeft) {
		var data = x + '|' + y;
		var tile = $map.find('[data-tile="' + data + '"]');
		if(tile.length < 1) {
			$map.append('<span class="tile" data-description data-tile="' + data + '" style="left: ' + (x - borderLeft) * 13 + 'px; top: ' + (y - borderTop) * 21 + 'px;">' +
				'<span class="description">(' + x + '|' + y + ')</span></span>');
			tile = $map.find('[data-tile="' + data + '"]');
		}
		return tile;
	}

	this.renderStats = function (data) {
		var last = getLastRenderData('stats'), $bar = $stats.find('[data-stats="hp"]');
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

		if(last.currentHp !== data.currentHp) {
			var current = data.currentHp, max = data.maxHp;

			$bar.find('.bar-title').html(current + '/' + max + ' HP');
			$bar.find('.bar-inner').css('width', String(current / max * 100) + '%');
		}

		if(typeof last.stats === 'undefined') {
			last.stats = {};
		}

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

			if(typeof last.stats[k] === 'undefined' || last.stats[k].xp !== data.stats[k].xp || last.stats[k].level !== data.stats[k].level) {
				$bar.data('description', description);
				$bar.find('.bar-title').html(stat.title + ' level ' + stat.level);
				$bar.find('.bar-inner').css('width', String(stat.xp / (stat.level * 10) * 100) + '%');
			}
		}

		setLastRenderData('stats', clone(data));
	};

	this.renderFullMap = function(map, position) {
		// 61x28 // 13x21 // RENDER
		var border = map.getBorder(), x = border.left, y = border.top, tx = x, ty = y, $tile, entity, symbol, c, description;
		while(ty <= border.bottom) {
			while(tx <= border.right) {
				$tile = getMapTile(tx, ty, border.top, border.left);
				entity = map.getEntity(tx, ty);
				if(tx === position.x && ty === position.y) {
					$tile.css('color', 'green').html('@').append('<div class="description">You (' + tx + '|' + ty + ')</div>');
				} else {
					renderEntity($tile, entity);
				}
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
			} else {
				renderEntity($tile, map.getEntity(entity.x, entity.y));
			}
		}
	};

	this.renderEntityDescription = function(tile) {
		$detail.html(tile.data('description'));
	};

	this.hideEntityDescription = function() {
		$detail.html('');
	}
}
