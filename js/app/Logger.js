function Logger() {}

Logger.log = function(who, message, color) {
	if(typeof color === 'undefined') {
		color = 'white';
	}
	$('#log').append(
		$('<div class="log-message"></div>').html('[<span style="color: gray">' + who +
			'</span>] <span style="color: ' + color + '">' + message + '</span>')
	).scrollTop(1e10);
};

Logger.clear = function() {
	$('#log').html('');
};
