var watch_tables = process.env.TABLES?(process.env.TABLES.split(",")):[];
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:examplepwd@postgres:5432/default';
var num_connections = process.env.WS_NUM_CONNECTIONS || 25;

var pg = require('pg');
const http = require("http");
var SocketCluster = require('socketcluster-client')

var mqtt = require("mqtt");

var sockets = [];

const httpRequestListener = function(req, res) {
    res.writeHead(200);
    res.end( sockets.length.toString() );
};

const httpServer = http.createServer(httpRequestListener);
httpServer.listen(8181);

// use socketcluster connection
if (process.env.SOCKETCLUSTER_HOST) {
    for (i=0; i<num_connections; i++) {
	sockets[i] = SocketCluster.connect({
	    hostname: process.env.SOCKETCLUSTER_HOST || "socketcluster",
	    secure: process.env.USE_SSL ? true : false,
	    port: process.env.SOCKETCLUSTER_PORT || 9500,
	    multiplex: false,
	    // should set this to true but for some reason it throws some stupid error
	    rejectUnauthorized: false
	});
    }
}

// use mqtt connection
if (process.env.MQTT_BROKER) {
    for (i=0; i<num_connections; i++){
	sockets[i] = mqtt.connect( process.env.MQTT_BROKER, {
	    username: process.env.MQTT_USERNAME,
	    password: process.env.MQTT_PASSWORD,
	    protocol: process.env.USE_SSL ? "wss" : "ws"
	});
    }
}

var channels = [];

pg.connect(connectionString, function(err, client) {
      if(err) {
        console.log(err);
      } else {
        console.log('+ Connected to ' + connectionString);
      }

      client.on('notification', function(msg) {
        var payload = msg.payload.split(";;");

    		if ( payload[0] == "CREATE") {
    		    var c1 = msg.channel + "_creates";
    		    sockets[Math.floor(Math.random()*sockets.length)].publish(c1, msg.payload)
    		}
	        if (["UPDATE", "DELETE", "ADJUST"].includes( payload[0] )) {
	    	    var c2 = msg.channel + '-'+ payload[1];
	    	    sockets[Math.floor(Math.random()*sockets.length)].publish(c2, msg.payload);
	        }


      });

	watch_tables.forEach(function(t){
	    console.log("+ Init listeners for " + t);
    	    client.query("LISTEN " + t);
    	    client.query("LISTEN " + t + "_updates");
    	    client.query("LISTEN " + t + "_creates");
    	    client.query("LISTEN " + t + "_deletes");
    	});
});
