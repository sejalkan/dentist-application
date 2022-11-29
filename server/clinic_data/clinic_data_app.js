const mongoose = require('mongoose');
const mqttHandler = require('../helpers/mqtt_handler');
const config = require('../helpers/config');
const clinicData = require('../helpers/schemas/clinic')

// Variables
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://' + config.clinicUser.name + ':' + config.clinicUser.password + '@cluster0.lj881zv.mongodb.net/?retryWrites=true&w=majority';
//const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ClinicDB';

// MQTT Client
const mqttClient = new mqttHandler(config.clinicUser.handler)
mqttClient.connect()

// Connect to MongoDB
const mongooseClient = mongoose.createConnection(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}, function (err) {
    if (err) {
        console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
        console.error(err.stack);
        process.exit(1);
    }
    console.log(`Connected to MongoDB with URI: ${mongoURI}`);
})

// Model creation
//const timeSlotModel = mongooseClient.model('timeslot', timeslotSchema)

// MQTT subscriptions
mqttClient.subscribeTopic('test')

// When a message arrives, respond to it or propagate it further
mqttClient.mqttClient.on('message', function (topic, message) {
    console.log(config.clinicUser.handler + " service received MQTT message")
    console.log(message.toString());

    switch (topic) {
        case 'test':
            mqttClient.sendMessage('testAppointment', 'Testing callback')
            break;
    }
    if (topic === 'mapDataRequest') {
        mapDataRequest()
    }
    if (topic === 'mapDataRequest') {
        mapDataRequest()
    }
});

function mapDataRequest() {
    let clinicNames = []
    let clinicCoordinates = []
    let clinicDescrip = []
    clinicData.find(function (err, clinic) {
        try {
            if (err) {
                return next(err);
            }
            clinicNames.push(clinic.name)
            clinicCoordinates.push(clinic.coordinates)
            clinicDescrip.push(clinic.descripText)
        }catch(err) {
            console.log(err)
            mqttClient.sendMessage('mapDataResponse', err)
        }
    })
    mqttClient.sendMessage('mapDataResponse', (clinicData.name, clinicData.coordinates, clinicData.descripText))
}
module.exports = mqttClient;