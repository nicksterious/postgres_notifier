# postgres_notifier

PG to Websocket notifier.

Connects to a PG database and listens for NOTIFY events and broadcasts them over Websockets, currently using socketcluster.

## Usage

Example docker-compose setup:

```
 postgresnotifier_development:
  image: flinkwise/postgresnotifier
  hostname: postgresnotifier_dev
  container_name: postgresnotifier_dev
  environment:
   DATABASE_URL: "postgres://${USERNAME}:${PASSWORD}@postgres:5432/development_database"
   SOCKETCLUSTER_NUM_CONNECTIONS: 10
   TABLES: "table1,table2,table3"
   SOCKETCLUSTER_PORT: 9500
   SOCKETCLUSTER_HOST: socketcluster
   USE_SSL: 1
  restart: "on-failure"
  depends_on:
   - postgres
   - socketcluster
  volumes:
   - "./_persistence/postgresnotifier_dev/logs:/logs"
```

# Production

This image is used in production at [Sportsbook software](https://www.sportsbooksoftware.com) and [white label sportsbook](https://www.whitelabelsportsbook.com) to broadcast changes to sports market data to several thousand concurrent users. The sports market data tables are watched using triggers and creates/updates/deletes are broadcast by this service through a LISTEN/NOTIFY pattern and Socketcluster service integrated with our sports and e-gaming frontends.
