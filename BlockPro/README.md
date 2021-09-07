# js-libp2p experiments for blockpro 

## get startet
1. git clone this repo 
2. run ```npm i``` in root directory
3. run ```docker-compose up``` to start 3 p2plib hosts in the docker environment
4. configure doichain node to publish new blockhashes to topic "rawblock": Start doichain daemon with: ```doichaind -zmqpubrawblock=tcp://127.0.0.1:28332```
or add ```zmqpubrawblock=tcp://127.0.0.1:28332``` to .doichain/doichain.conf
5. connect to peer1 ```docker-compose exec peer1 bash```and run from /js-libp2p/examples/pubsub ```npm run peer1```
6. connect to peer2 ```docker-compose exec peer1 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer2```
7. connect to peer3 ```docker-compose exec peer3 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer3```


## Offene Fragen
Aktueller Stand ist lediglich eine Arbeitshypothese. Es handelt sich um eine Studie zur Funktionsweise von libp2p.

1. Timing: Ungeschriebene Zählerstände dürfen nicht verloren gehen
2. Vermeidung von doppelten Einträgen
3. Überprüfung des verhashten Dokuments (51% Konsens)
4. Brauchen wir queues für die Zählerstände
5. Sicherheitsfrage: Signatur des Blocks mit vorheriger CID
6. Timing des nächsten Blocks
7. zmq eintrudelnde Rätsel handeln lassen
8. Incentive: MultiSig Adresse mit Grundgebühr, wo jeder einzahlt 
    - Kombination aus pub keys -> wann veröffentlichen? 
9. Prüfung:
    - ist der Gewinner der Gewinner?
    - ist mein Zählerstand verewigt?
    - sind die wichtigsten nodes online? 75/100 
    - dynamisches MultiSig Konto mit den public keys der letzten Runde und restbetrag auf das neue MultiSig wallet


