import Libp2p from 'libp2p'
import TCP from 'libp2p-tcp'
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'libp... Remove this comment to see the full error message
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import Gossipsub from 'libp2p-gossipsub'
import Bootstrap from 'libp2p-bootstrap'
import bootstrapers from './peerIds/bootstrapers.js'


const createNode = async (id: any) => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/15000']
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      pubsub: Gossipsub,
      peerDiscovery: [Bootstrap]
    },
    config: {
      peerDiscovery: {
        bootstrap: {
          interval: 60e3,
          enabled: true,
          list: bootstrapers
        }
      }
    },
    peerId: id
  })

  return node
}

export default createNode;
