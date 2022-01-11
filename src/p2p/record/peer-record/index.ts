'use strict'

const { Multiaddr } = require('multiaddr')
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'PeerId'.
const PeerId = require('peer-id')
const arrayEquals = require('libp2p-utils/src/array-equals')

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'Protobuf'.
const { PeerRecord: Protobuf } = require('./peer-record')
const {
  ENVELOPE_DOMAIN_PEER_RECORD,
  ENVELOPE_PAYLOAD_TYPE_PEER_RECORD
} = require('./consts')

/**
 * @typedef {import('../../peer-store/address-book.js').Address} Address
 * @typedef {import('libp2p-interfaces/src/record/types').Record} Record
 */

/**
 * @implements {Record}
 */
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'PeerRecord... Remove this comment to see the full error message
class PeerRecord {
  _marshal: any;
  codec: any;
  domain: any;
  multiaddrs: any;
  peerId: any;
  seqNumber: any;
  /**
   * The PeerRecord is used for distributing peer routing records across the network.
   * It contains the peer's reachable listen addresses.
   *
   * @class
   * @param {Object} params
   * @param {PeerId} params.peerId
   * @param {Multiaddr[]} params.multiaddrs - addresses of the associated peer.
   * @param {number} [params.seqNumber] - monotonically-increasing sequence counter that's used to order PeerRecords in time.
   */
  constructor ({
    peerId,
    multiaddrs = [],
    seqNumber = Date.now()
  }: any) {
    this.domain = ENVELOPE_DOMAIN_PEER_RECORD
    this.codec = ENVELOPE_PAYLOAD_TYPE_PEER_RECORD

    this.peerId = peerId
    this.multiaddrs = multiaddrs
    this.seqNumber = seqNumber

    // Cache
    this._marshal = undefined
  }

  /**
   * Marshal a record to be used in an envelope.
   *
   * @returns {Uint8Array}
   */
  marshal () {
    if (this._marshal) {
      return this._marshal
    }

    this._marshal = Protobuf.encode({
      peerId: this.peerId.toBytes(),
      seq: this.seqNumber,
      addresses: this.multiaddrs.map((m: any) => ({
        multiaddr: m.bytes
      }))
    }).finish()

    return this._marshal
  }

  /**
   * Returns true if `this` record equals the `other`.
   *
   * @param {unknown} other
   * @returns {boolean}
   */
  equals (other: any) {
    if (!(other instanceof PeerRecord)) {
      return false
    }

    // Validate PeerId
    if (!this.peerId.equals(other.peerId)) {
      return false
    }

    // Validate seqNumber
    if (this.seqNumber !== other.seqNumber) {
      return false
    }

    // Validate multiaddrs
    if (!arrayEquals(this.multiaddrs, other.multiaddrs)) {
      return false
    }

    return true
  }
}

/**
 * Unmarshal Peer Record Protobuf.
 *
 * @param {Uint8Array} buf - marshaled peer record.
 * @returns {PeerRecord}
 */
PeerRecord.createFromProtobuf = (buf: any) => {
  const peerRecord = Protobuf.decode(buf)

  const peerId = PeerId.createFromBytes(peerRecord.peerId)
  const multiaddrs = (peerRecord.addresses || []).map((a: any) => new Multiaddr(a.multiaddr))
  const seqNumber = Number(peerRecord.seq)

  return new PeerRecord({ peerId, multiaddrs, seqNumber })
}

PeerRecord.DOMAIN = ENVELOPE_DOMAIN_PEER_RECORD

module.exports = PeerRecord
