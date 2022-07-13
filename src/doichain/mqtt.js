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


export async function listenToMQTT() {
    let KEY = fs.readFileSync(filePathKey)
    let CERT = fs.readFileSync(filePathCrt)
    let CA = fs.readFileSync(filePathCA)

    const clientId = 'mqttjs_' + Math.random().toString(8).substr(2, 4)
    let url = "mqtts://" + process.env.MQTT_HOSTNAME
    var options = {
        port: 8883,
        host: process.env.MQTT_HOSTNAME,
        rejectUnauthorized : false,
        ca: CA,
        key: KEY,
        cert: CERT,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: clientId,
        mqttVersion: 3
    };

    const client = mqtt.connect(url, options);

    client.on('connect', function () {
        console.log('Connected')
        client.subscribe('test', function (err) {
          if (!err) {
            //client.publish('test', 'Hello mqtt')
          }else {
            console.log(err)
          }
        })
    })

    client.on('message', async function (topic, message) {

        obisJSON["timestamp"] = Date.now()
        let stringJSON = message.toString()
        // console.log("__tringJSON", stringJSON)

        console.info('writing data into ipfs')

        let eigeneCid = await writeToIPFS(stringJSON)
        s.eigeneCID = eigeneCid.toString()

        console.info('__eigeneCID', s.eigeneCID)
        let publishString = "Z " + `${s.id}, ${s.eigeneCID}`
        await publish(publishString, topicQuiz)

        // message is Buffer
        console.log(message.toString())

    })
}