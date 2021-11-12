# BlockPro

[![Tags][tags-shield]][tags-url]
[![Issues][issues-shield]][issues-url]
[![Commits][commits-shield]][commits-url]
[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![YouTube][youtube-shield]][youtube-url]
[![Twitter][twitter-shield]][twitter-url]


## Table of Contents
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Resources](#resources)
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

BlockPro dient dem Herkunfts- und Verbrauchsnachweis von erneuerbarer Energie zwischen Produzenten und Konsumenten (Prosumenten).
Über das Second-Layer Modell werden im Konsens Prosumenten ausgewählt, die die gesammelten Zählerstände aller peers in die Doichain schreiben und hierfür ein Bounty erhalten. 


<img
src="./images/Activity Diagram Libp2p.jpg"
raw=true
alt="Aktivitätsdiagramm zum Peer2Peer Demoprotokoll"
style="margin-right: 10px; width: 900px"
/>


## Resources
1. Serial Port npm package https://www.npmjs.com/package/serialport
2. Example on how to call the RPC on Doichain 
    - getblockcount https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L223
    - listtransactions https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L260
    - the rpc-client implementation https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/imports/startup/server/doichain-configuration.js
    - namecoin rpc lib - https://www.npmjs.com/package/namecoin 

## Contributing

<a href="https://github.com/webanizer/BlockPro/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=webanizer/BlockPro" />
</a>


Small note: If editing the Readme, please conform to the [![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme) specification.

### Any optional sections

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[MIT © 2021 Webanizer AG.](./LICENSE.txt)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[tags-shield]: https://img.shields.io/github/v/tag/webanizer/BlockPro
[tags-url]: https://github.com/webanizer/BlockPro/releases
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/webanizer/BlockPro/graphs/contributors
[commits-shield]: https://img.shields.io/github/commit-activity/m/webanizer/BlockPro
[commits-url]: https://github.com/webanizer/BlockPro/commits/main
[stars-shield]: https://img.shields.io/github/stars/webanizer/BlockPro?style=social
[stars-url]: https://github.com/webanizer/BlockPro/stargazers
[issues-shield]: https://img.shields.io/github/issues-closed-raw/webanizer/BlockPro
[issues-url]: https://github.com/webanizer/BlockPro/issues
[license-shield]: https://img.shields.io/npm/l/doichain
[license-url]: https://github.com/webanizer/BlockPro/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin&labelColor=blue
[linkedin-url]: https://www.linkedin.com/company/webanizer-ag/about/
[youtube-shield]: https://img.shields.io/youtube/channel/views/UChqFCLQ0UfCL9GGgyS0I5oQ?style=social
[youtube-url]: https://www.youtube.com/channel/UChqFCLQ0UfCL9GGgyS0I5oQ
[twitter-shield]: https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Fdoichain
[twitter-url]: https://twitter.com/doichain
