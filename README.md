# BlockPro

Im Rahmen des BlockPro Projekts wird ein blockchainbasierter Herkunftsnachweis für erneuerbare Energien entwickelt. Transaktionen zwischen Energieerzeuger und Konsumenten werden manipulations- und revisionssicher in der Doichain gespeichert. Bisher wird Grünstrom auf Kontingentbasis verkauft, wohingegen mit BlockPro genaue Daten für den Peer-to-Peer-Handel erfasst werden. So können Jahresspitzenlasten ausgeglichen und Netznutzungsgebühren eingespart werden. 

1. BlockPro

BlockPro besteht derzeit aus zwei Beispielen. Consolinno2IPFS empfängt über einen optischen Lesekopf viertelstündlich den Zählerstand eines Stromzählers. Anschließend werden die Zählerdaten in das Interplanetary Filesystem (IPFS) hochgeladen. Anschließend werden die Zählerdaten mittels SHA-256 verhasht und mittels RPC call in die Doichain gespeichert. Dazu wird der "name_doi" Befehl verwendet, wobei der SHA-256 Hash als name und die CID (der Hash aus dem Upload ins IPFS) wird als zugehöriger value gespeichert. Eine Eintrag in die Doichain kostet dabei 0.01 DOI.

2. Peer2Peer Demoprotokoll

Beim zweiten Beispiel, dem Peer2Peer Demoprotokoll, handelt es sich um eine Studie zur Funktionsweise von Libp2p. Libp2p ist ein modulares System von Protokollen, Spezifikationen und Bibliotheken, die die Entwicklung von Peer-to-Peer-Netzwerkanwendungen ermöglichen. Da bei der Anzahl an geplanten Nutzern von BlockPro die maximale Verarbeitungskapazität der Doichain überschritten würde, wenn beispielsweise alle 2 Millionen Solaranlagenbetreiber alle 15 Minuten ihre Zählerstände in die Doichain speichern würden, soll zunächst eine Untergruppe an teilnehmenden Nodes ausgewählt werden. Dieser Auswahlprozess wird vom peer2peer Demoprotokoll durchgeführt. Zunächst erstellen die Nodes über Libp2p eine Verbindung zu den andern Nodes her. Anschließend veröffentlichen sie über publish and subscribe eine Zufallsnummer, die mit einer ebenfalls zufällig generierten Zahl verglichen wird. Diejenige Node, deren Zahl am nähsten zur Lösung liegt ist ausgewählt die ebenfalls über publish and subscribe empfangenen Zählerstände der anderen Teilnehmer, sowie die eigenen in ein Dokument zusammenzutragen. Die Zählerstände werden dabei nicht direkt empfangen, sondern in Form einer CID, die den Pfad zum Zählerstand auf dem IPFS beschreibt.

Diese Liste an CIDs wird wiederum ins IPFS hochgeladen und mittels SHA-256 verhasht. Der "Gewinner-Node" schreibt anschließend den SHA-256 Hash als name zusammen mit der CID zur Liste aller gesammelter CIDs im IPFS als value in die Doichain.

Um einerseits die Storage Fee der Doichain in Höhe von 0.01 DOI begleichen zu können und andererseits eine Belohnung und einen Anreiz zur Dokumentation der Zählerstände in der Doichain zu erhalten, senden die übrigen Nodes dem Gewinner einen kleinen Doi-Beitrag an dessen über das libp2p veröffentlichte Addresse. 

Nun beginnt das nächste Rätsel um den Auserwählten, der die neuen Zählerstände in die Blockchain bzw. das IPFS speichert. 

Weitere Details und Anleitungen finden sich in den READMEs der beiden Beispielordner.


<img
src="./images/Activity Diagram Libp2p.jpg"
raw=true
alt="Aktivitätsdiagramm zum Peer2Peer Demoprotokoll"
style="margin-right: 10px;"
/>


### Resources
1. Serial Port npm package https://www.npmjs.com/package/serialport
2. Example on how to call the RPC on Doichain 
    - getblockcount https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L223
    - listtransactions https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L260
    - the rpc-client implementation https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/imports/startup/server/doichain-configuration.js
    - namecoin rpc lib - https://www.npmjs.com/package/namecoin 