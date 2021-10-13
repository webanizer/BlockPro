import settings from "./settings.js"

const getUrl = () =>{
    //console.log('settings.getSettings()',settings.getSettings())
    if(settings.getSettings().electrumHost===undefined && settings.getSettings().electrumPort === undefined) return "" //for development purposes (proxy,cors)
    else{
        let ssl = settings.electrumSSL
        let port = settings.electrumPort
        let host = settings.electrumHost
        let protocol = "http://";
        if(ssl =="ssl") protocol = "https://";
        return protocol+host+":"+port;
    }
}

export default getUrl
