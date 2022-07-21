import * as mqtt from "mqtt"
import writeToIPFS from './writeToIPFS.js'
import { publish } from '../p2p/publish.js'
import { s } from '../p2p/sharedState.js'
import fs from 'fs'
import path from 'path'
const __dirname = path.resolve('./');
const filePathKey = `${__dirname}/src/doichain/keys/client.key`
const filePathCrt = `${__dirname}/src/doichain/keys/client.crt`
const filePathCA = `${__dirname}/src/doichain/keys/ca.crt`


export async function listenToMQTT(topicQuiz) {
  let KEY = fs.readFileSync(filePathKey)
  let CERT = fs.readFileSync(filePathCrt)
  let CA = fs.readFileSync(filePathCA)

  const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)  //"mqtt-explorer-170393"
  let url = "mqtts://" + process.env.MQTT_HOSTNAME
  var options = {
    port: 8883,
    host: process.env.MQTT_HOSTNAME,
    rejectUnauthorized: false,
    ca: CA,
    key: KEY,
    cert: CERT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: clientId,
    mqttVersion: 3
  };

  const client = mqtt.connect(url, options);

  client.on('connect', function (msg, err) {
    console.log('Connected')


    client.subscribe(process.env.MQTT_TOPIC, function (msg, err) {
      if (!err) {
        //client.publish('test', 'Hello mqtt')
        console.log("successfully subscribed")
      } else {
        console.log(msg)
        console.log(err)
      }
    })
  })

  client.on('message', async function (topic, message) {

    let stringJSON = message.toString()

    let jsonMessage = JSON.parse(stringJSON)

    let timestamp = new Date(jsonMessage.timestamp)

    let minutesToRound = 15
    // round timestamp to nearest 15 mins 
    timestamp = roundToNearest15(timestamp, minutesToRound)

    function roundToNearest15(date, minutesToRound) {
      let hours = date.getHours()
      let minutes = date.getMinutes()
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      // Convert hours and minutes to time in minutes
      let time = (hours * 60) + minutes;

      let rounded = Math.round(time / minutesToRound) * minutesToRound;
      let rHr = '' + Math.floor(rounded / 60)
      let rMin = '' + rounded % 60

      date.setHours(rHr.padStart(2, '0'))
      date.setMinutes(rMin.padStart(2, '0'))
      return date
    }

    // To Do: MeterId verschlüsselt in IPFS speichern

    jsonMessage.timestamp = timestamp.getTime()

    stringJSON = JSON.stringify(jsonMessage)

    console.info('writing data into ipfs')

    let eigeneCid = await writeToIPFS(stringJSON)
    s.eigeneCID = eigeneCid.toString()

    console.info('__eigeneCID', s.eigeneCID)
    let publishString = "Z " + `${s.id}, ${s.eigeneCID}`
    await publish(publishString, topicQuiz)

    // message is Buffer
    console.log(stringJSON)

  })
}