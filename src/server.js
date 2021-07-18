var watch_tables = process.env.TABLES?(process.env.TABLES.split(",")):[];
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:examplepwd@postgres:5432/default';
var num_connections = process.env.SOCKETCLUSTER_NUM_CONNECTIONS || 25;

var pg = require('pg');
const http = require("http");
var SocketCluster = require('socketcluster-client')

var sockets = [];

const httpRequestListener = function(req, res) {
    res.writeHead(200);
    res.end( sockets.length.toString() );
};

const httpServer = http.createServer(httpRequestListener);
httpServer.listen(8181);


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

    var socket = SocketCluster.connect({
	hostname: process.env.SOCKETCLUSTER_HOST || "socketcluster",
	secure: process.env.USE_SSL ? true : false,
	port: process.env.SOCKETCLUSTER_PORT || 9500,
	multiplex: true,
	// should set this to true but for some reason it throws some stupid error
	rejectUnauthorized: false
    });

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
    		    var tchannel = sockets[Math.floor(Math.random()*sockets.length)].subscribe(msg.channel + "_creates");
	    	    tchannel.on('subscribe', function(){
	    		tchannel.publish(msg.payload, function(err, ackData){
	    		    tchannel.unsubscribe();
	    		    tchannel.off();
	    		    // console.log(msg.channel + ": " + msg.payload);
	    		});
	    	    });
    		}
	        if (["UPDATE", "DELETE", "ADJUST"].includes( payload[0] )) {
	    	    var tchannel = sockets[Math.floor(Math.random()*sockets.length)].subscribe(msg.channel + '-'+ payload[1]);
	    	    tchannel.on('subscribe', function(){
	    		tchannel.publish(msg.payload, function(err, ackData){
	    		    tchannel.unsubscribe();
	    		    tchannel.off();
	    		    // console.log(msg.channel + ": " + msg.payload);
	    		});
	    	    });
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
