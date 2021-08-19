# js-libp2p experiments for blockpro 

## get startet
1. git clone this repo 
2. run ```npm i``` in root directory
3. run ```docker-compose up``` to start 3 p2plib hosts in the docker environment
4. connect to peer1 ```docker-compose exec peer1 bash```and run from /js-libp2p/examples/pubsub ```npm run peer1```
5. connect to peer2 ```docker-compose exec peer1 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer2```
6. connect to peer3 ```docker-compose exec peer3 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer3```


## Offene Fragen
Aktueller Stand ist lediglich eine Arbeitshypothese. Es handelt sich um eine Studie zur Funktionsweise von libp2p.

1. Timing: Ungeschriebene Zählerstände dürfen nicht verloren gehen
2. Vermeidung von doppelten Einträgen
3. Überprüfung des verhashten Dokuments (51% Konsens)
4. Brauchen wir queues für die Zählerstände