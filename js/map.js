var mapManager = game.getMapManager(), map = mapManager.createMap();
map.setBorder(-10,-10,10,10);
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

map.setEntity(-5,-5,'enemy');

mapManager.addMap('default', map);
mapManager.setCurrentMap('default');
