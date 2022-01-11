var settings = {
  
  testnet: false,
  
  electrumHost: "spotty-goat-4.doi.works",
  electrumPort: "50002",
  electrumSSL: "ssl",

  getSettings: function () {
    return this;
  },
  setSettings: function (_settings: any) {
    if(_settings.testnet !== undefined) this.testnet = _settings.testnet    
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'from' does not exist on type '{ testnet:... Remove this comment to see the full error message
    if (_settings.from !== undefined) this.from = _settings.from
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'port' does not exist on type '{ testnet:... Remove this comment to see the full error message
    if (_settings.port !== undefined) this.port = _settings.port
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'host' does not exist on type '{ testnet:... Remove this comment to see the full error message
    if (_settings.host !== undefined) this.host = _settings.host
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'ssl' does not exist on type '{ testnet: ... Remove this comment to see the full error message
    if (_settings.ssl !== undefined) this.ssl = _settings.ssl
    if (_settings.electrumHost !== undefined) this.electrumHost = _settings.electrumHost
    if (_settings.electrumPort !== undefined) this.electrumPort = _settings.electrumPort
    if (_settings.electrumSSL !== undefined) this.electrumSSL = _settings.electrumSSL
  }
};

export default settings
