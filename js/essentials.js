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

function clone(obj) {
	var clone = {};
	for(var k in obj) {
		clone[k] = this[k];
	}
	return clone;
}

var drag = false, lastX, lastY;

$('#map-outer').on('mousedown', function(e) {
	drag = true;
	lastX = e.pageX;
	lastY = e.pageY;
	$(this).css('cursor', 'move');
}).on('mouseup', function() {
	drag = false;
	$(this).css('cursor', 'pointer');
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
