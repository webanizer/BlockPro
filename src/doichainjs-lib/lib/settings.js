var settings = {
  
  testnet: false,
  
  electrumHost: "172.22.0.6",
  electrumPort: "50002",
  electrumSSL: "ssl",

  getSettings: function () {
    return this;
  },
  setSettings: function (_settings) {
    if(_settings.testnet !== undefined) this.testnet = _settings.testnet    
    if (_settings.from !== undefined) this.from = _settings.from
    if (_settings.port !== undefined) this.port = _settings.port
    if (_settings.host !== undefined) this.host = _settings.host
    if (_settings.ssl !== undefined) this.ssl = _settings.ssl
    if (_settings.electrumHost !== undefined) this.electrumHost = _settings.electrumHost
    if (_settings.electrumPort !== undefined) this.electrumPort = _settings.electrumPort
    if (_settings.electrumSSL !== undefined) this.electrumSSL = _settings.electrumSSL
  }
};

export default settings
