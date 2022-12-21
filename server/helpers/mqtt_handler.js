const mqtt = require('mqtt');
let config
try {
    config = require('./config-server');
} catch (e) {
    config = require('./dummy_config')
}

/**
 * MQTT client creation class
 */
class MqttHandler {
    constructor(username, password, clientId) {
        this.mqttClient = null;
        this.host = config.module_config.host;
        this.clientId = clientId;
        this.username = username;
        this.password = password;
    }

    /**
     * Establishes a connection to the MQTT broker with the current client instance
     */
    connect() {
        // Connect mqtt with credentials
        console.log(this.host)
        this.mqttClient = mqtt.connect(this.host,
            {
                username: this.username,
                password: this.password,
                clientId: this.clientId,
                reconnectPeriod: 1000
            });

        // Mqtt error callback
        this.mqttClient.on('error', (err) => {
            console.log('Error on client ' + this.clientId);
            console.log(err);
            this.mqttClient.end();
        });

        // Connection callback
        this.mqttClient.on('connect', () => {
            console.log(`mqtt client ${this.clientId} connected to ${this.host}`);
        });

        this.mqttClient.on('close', () => {
            console.log(`mqtt client ${this.clientId} disconnected`);
        });
    }

    /**
     * Sends a message via MQTT
     *
     * @param topic
     * @param message
     */
    sendMessage(topic, message) {
        this.mqttClient.publish(topic, message);
    }

    /**
     * Subscribes to an MQTT topic
     *
     * @param topic
     */
    subscribeTopic(topic) {
        this.mqttClient.subscribe(topic);
        console.log('subscribed to: ' + topic)
    }
}

module.exports = MqttHandler;