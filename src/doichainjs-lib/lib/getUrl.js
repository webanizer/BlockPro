import settings from "./settings.js"

const getUrl = () =>{
    //console.log('settings.getSettings()',settings.getSettings())
    if(settings.getSettings().host===undefined && settings.getSettings().port === undefined) return "" //for development purposes (proxy,cors)
    else{
        let ssl = settings.getSettings().ssl?settings.getSettings().ssl:false
        let port = settings.getSettings().port?settings.getSettings().port:3000
        let host = settings.getSettings().host?settings.getSettings().host:"localhost"
        let protocol = "http://";
        if(ssl===true) protocol = "https://";
        return protocol+host+":"+port;
    }
}

export default getUrl
