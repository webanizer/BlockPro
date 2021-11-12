# BlockPro

[![Commits][commits-shield]][commits-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

## Table of Contents
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Resources] (#resources)
- [Contributing](#contributing)
- [License](#license)

## Background

Im Rahmen des BlockPro Projekts wird ein blockchainbasierter Herkunftsnachweis für erneuerbare Energien entwickelt. Transaktionen zwischen Energieerzeuger und Konsumenten werden manipulations- und revisionssicher in der Doichain gespeichert. Bisher wird Grünstrom auf Kontingentbasis verkauft, wohingegen mit BlockPro genaue Daten für den Peer-to-Peer-Handel erfasst werden. So können Jahresspitzenlasten ausgeglichen und Netznutzungsgebühren eingespart werden. 

## Install
1. git clone this repo 
2. run ```npm i``` in root directory
3. run ```docker-compose up``` to start 3 p2plib hosts in the docker environment
4. configure doichain node to publish new blockhashes to topic "rawblock": Start doichain daemon with: ```doichaind -zmqpubrawblock=tcp://127.0.0.1:28332```
or add ```zmqpubrawblock=tcp://127.0.0.1:28332``` to .doichain/doichain.conf
5. connect to peer1 ```docker-compose exec peer1 bash```and run from /js-libp2p/examples/pubsub ```npm run peer1```
6. connect to peer2 ```docker-compose exec peer1 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer2```
7. connect to peer3 ```docker-compose exec peer3 bash``` and run from /js-libp2p/examples/pubsub ```npm run peer3```

## Usage 

Libp2p ist ein modulares System von Protokollen, Spezifikationen und Bibliotheken, die die Entwicklung von Peer-to-Peer-Netzwerkanwendungen ermöglichen. Da bei der Anzahl an geplanten Nutzern von BlockPro die maximale Verarbeitungskapazität der Doichain überschritten würde, wenn beispielsweise alle 2 Millionen Solaranlagenbetreiber alle 15 Minuten ihre Zählerstände in die Doichain speichern würden, soll zunächst eine Untergruppe an teilnehmenden Nodes ausgewählt werden. Dieser Auswahlprozess wird vom p2p Demoprotokoll durchgeführt. Zunächst stellen die Nodes über libp2p eine Verbindung zu den andern Nodes her. Anschließend veröffentlichen sie über publish and subscribe eine Zufallsnummer, die mit einer ebenfalls zufällig generierten Lösungzahl verglichen wird. Diejenige Node, deren Zahl am nächsten zur Lösung liegt, ist ausgewählt die ebenfalls über publish and subscribe empfangenen Zählerstände der anderen Teilnehmer, sowie die Eigenen, in ein Dokument zusammenzufügen. Die Zählerstände werden dabei nicht direkt empfangen, sondern in Form einer CID, die der Pfad zum Zählerstand auf dem IPFS ist.

Diese Liste an CIDs wird wiederum ins IPFS hochgeladen und mittels SHA-256 verhasht. Der "Gewinner-Node" schreibt anschließend den SHA-256 Hash als name zusammen mit der CID zur Liste aller gesammelter CIDs im IPFS als value in die Doichain. So können die anderen Teilnehmer ihre eigene CID auf der Liste suchen und mit dem Hash verifizieren, dass ihr Zählerstand manipulationssicher in der Doichain gespeichert wurde. 


<img
src="./images/Activity Diagram Libp2p.jpg"
raw=true
alt="Aktivitätsdiagramm zum Peer2Peer Demoprotokoll"
style="margin-right: 10px;"
/>


## Resources
1. Serial Port npm package https://www.npmjs.com/package/serialport
2. Example on how to call the RPC on Doichain 
    - getblockcount https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L223
    - listtransactions https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L260
    - the rpc-client implementation https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/imports/startup/server/doichain-configuration.js
    - namecoin rpc lib - https://www.npmjs.com/package/namecoin 

## Contributing

<a href = "https://github.com/webanizer/BlockPro/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo = webanizer/BlockPro" style="width:200px;"/>
</a>

Made with [contributors-img](https://contrib.rocks).

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

### Any optional sections

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[MIT © 2021 Webanizer AG.](./LICENSE.txt)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/webanizer/BlockPro/graphs/contributors
[commits-shield]: https://img.shields.io/github/commit-activity/m/webanizer/BlockPro
[commits-url]: https://github.com/webanizer/BlockPro/commits/main
[stars-shield]: https://img.shields.io/github/stars/webanizer/BlockPro?style=social
[stars-url]: https://github.com/webanizer/BlockPro/stargazers
[issues-shield]: https://img.shields.io/github/issues-closed-raw/webanizer/BlockPro
[issues-url]: https://github.com/webanizer/BlockPro/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/webanizer/BlockPro/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/webanizer-ag/about/
[product-screenshot]: images/Activity Diagram Libp2p.jpg