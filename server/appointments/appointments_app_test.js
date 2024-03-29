/**
 * A class purely for testing the backend MQTT endpoints that exist within the clinic_data component.
 * Each describe, and it has a description of what they do within their sting field.
 *
 * @author Burak Askan (@askan)
 */
const assert = require('assert')
const mqttHandler = require('../helpers/mqtt_handler');
const util = require("util");
const resolvePath = require("object-resolve-path")
const {MqttClient} = require("mqtt");
let config
try {
    config = require('../helpers/config-server');
} catch (e) {
    config = require('../helpers/dummy_config')
}

mqttClient = new mqttHandler(config.module_config.appointmentUser.test.name, config.module_config.appointmentUser.test.password, config.module_config.appointmentUser.test.handler)
let clinicStored

/**
 * A method that sends mqtt message and listens for a response.
 * When response arrives, it compares it to the value that was expected to be response.
 * If they do not match it throws an error.
 *
 * @param topicRequest The topic that the message this method sends a message to
 * @param topicResponse The topic that the listener within this method listens to
 * @param messageSend The JSON message that is sent with the MQTT message
 * @param expectedResult The JSON value that is expected as a response
 * @returns {Promise<unknown>} Either an error or a JSON value that was received
 */
function asyncMethod(topicRequest, topicResponse, messageSend, expectedResult) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(topicRequest + topicResponse + messageSend)
            mqttClient.connect()
            mqttClient.subscribeTopic("123/" + topicResponse)
            mqttClient.sendMessage(topicRequest, JSON.stringify(messageSend))
            mqttClient.mqttClient.on('message', function (topic, message) {
                console.log(topic + " : is the topic of this message")
                console.log('Message is received: ' + message + ' ::: This was the expectation: ' + JSON.stringify(expectedResult))

                if (topic === ("123/" + topicResponse)) {
                    if (topic !== "123/clinicData" || messageSend.body !== undefined && messageSend.body.test) {
                        if (!util.isDeepStrictEqual(JSON.parse(message), expectedResult)) {
                            reject(new Error(message + " is not the expected message. This is: " + JSON.stringify(expectedResult)
                                + ". The listing topic in backend: " + topicRequest + ". The listening topic in testing: " + topicResponse))
                        }
                    }
                    resolve(JSON.parse(message));
                }
            });
        }, 500)
    })
}

describe("Tests to see if the tests are working", function () {
    //Just a test to see if I am screwing up any of the mocha testing
    describe('Simple Multiplication', function () {
        it('This is for testing purposes. Fifty times two should equal one hundred', function () {
            let result = 50 * 2;
            assert.equal(result, 100)
        })
    })

    // await attempt at async testing
    describe('Tests to see if MQTT is working', function () {
        it('Is MQTT working? We want back ToothyClinic', async function () {
            this.timeout(10000)
            const expectedResult = {
                openingHours: {
                    monday: {start: "8:00", end: "17:00"},
                    tuesday: {start: "8:00", end: "17:00"},
                    wednesday: {start: "8:00", end: "17:00"},
                    thursday: {start: "8:00", end: "17:00"},
                    friday: {start: "8:00", end: "17:00"}
                },
                _id: "639f999b75948aaabf80d80f",
                dentists: [],
                timeslots: ["63a1a393e2743de0e3b4845c"],
                name: "Testing Clinic",
                password: "$2b$10$WnpIf0U4aaTn9x2dHFUnvu4MdpVuHdzQr.eyMIPsxJ96Mx/risOuy",
                email: "burakaskan2001@gmail.com",
                address: "Lindholmen",
                city: "Göteborg",
                __v: 1
            }
            clinicStored = await asyncMethod("clinicDataRequest", "clinicData", {
                clientId: "123",
                body: {email: "gusaskbu@student.gu.se"}
            }, expectedResult)

        })
    })
})

describe('AppointmentTests. Runs tests that checks up on every backend endpoint belonging to the appointments service.', function () {
    describe('bookAppointment', function () {
        it('See if timeslot gets booked', async function () {
            this.timeout(20000)
            const messageSend = {
                clientId: "123",
                body: {
                    clinicId: clinicStored._id,
                    patientInfo: {
                        name: "John Jane",
                        email: "burakaskan2001@gmail.com",
                        dateOfBirth: "2001-08-17",
                        text: "My tooth aches"
                    },
                    dentistID: clinicStored.dentists[0],
                    date: "2023-08-17",
                    time: "09:30"
                }
            }

            const expectedResult = {
                _id:"id",
                dentist:{
                    workweek:{
                        monday:false,
                        tuesday:true,
                        wednesday:false,
                        thursday:true,
                        friday:false
                    },
                    _id:"id",
                    clinic:"id",
                    name:"Solomon Mathews",
                    email:"burakaskan2001@gmail.com",
                    phoneNumber:"0769136300",
                    timeslots:["id"],
                    __v:0
                },
                patient:{
                    _id:"id",
                    timeslots:["id"],
                    name:"John Jane",
                    email:"burakaskan2001@gmail.com",
                    dateOfBirth:"2001-08-17",
                    text:"My tooth aches",
                    __v:0
                },
                clinic:{
                    coordinates:{longitude:11.943074635698956,latitude:57.7057104},
                    openingHours:{
                        monday:{start:"08:00",end:"17:00"},
                        tuesday:{start:"08:00",end:"17:00"},
                        wednesday:{start:"08:00",end:"17:00"},
                        thursday:{start:"08:00",end:"17:00"},
                        friday:{start:"08:00",end:"17:00"},
                        lunchHour:"12:00",fikaHour:"14:00"},
                    _id:"id",
                    dentists:["id"],
                    mapStorage:{},
                    name:"Clinic Testing",
                    password:"password",
                    email:"gusaskbu@student.gu.se",
                    address:"Lindholmen",
                    city:"Göteborg",
                    __v:1,
                    owner:"Oscar Davidsson"
                },
                date:"2023-08-17",
                startTime:"09:30",
                __v:0
            }
           await asyncMethod("bookAppointment", "appointmentResponse", messageSend, expectedResult)
        })
    })

    describe('sendAppointmentInformation', function () {
        it('See if timeslot(s) can be recieved', async function () {
            this.timeout(10000)
            const messageSend = {
                clientId: "123",
                body: {
                    clinicId: clinicStored._id,
                    test: "This is for a test"
                }
            }
            const expectedResult = {
                body:{
                    sortedArray:[{
                        key:"2023-08-17",
                        value:[{
                            id:"id",
                            patient:{
                                name:"John Jane",
                                text:"My tooth aches"
                            },
                            dentist:{name:"Solomon Mathews"},
                            timeslot:"09:30"}
                        ]}
                    ]}
            }
            await asyncMethod("sendAppointmentInformation", "appointmentInformationResponse", messageSend, expectedResult)
        })
    })

    describe('cancelBookedTimeslot', function () {
        it('See if timeslot is canceled', async function () {
            this.timeout(10000)
            const fetchClinicExpectation = {
                openingHours: {
                    monday: {start: "8:00", end: "17:00"},
                    tuesday: {start: "8:00", end: "17:00"},
                    wednesday: {start: "8:00", end: "17:00"},
                    thursday: {start: "8:00", end: "17:00"},
                    friday: {start: "8:00", end: "17:00"}
                },
                _id: clinicStored._id,
                dentists: [],
                timeslots: [],
                name: "Testing Clinic",
                password: "password",
                email: "burakaskan2001@gmail.com",
                address: "Lindholmen",
                city: "Göteborg",
                __v: 0
            }
            clinicStored = await asyncMethod("clinicDataRequest", "clinicData", {
                clientId: "123",
                body: {email: "gusaskbu@student.gu.se"}
            }, fetchClinicExpectation)
            const mapStorage = new Map(Object.entries(clinicStored.mapStorage))
            const mapStorageContents = mapStorage.get("2023-08-17")
            const messageSend = {
                clientId: "123",
                body: {
                    timeslotID: mapStorageContents.timeslots[0]
                }
            }
            const expectedResult = {
                response: "Success"
            }
            await asyncMethod("cancelAppointment", "canceledAppointment", messageSend, expectedResult)
        })
        it('Check if timeslot was deleted', async function () {
            this.timeout(10000)
            const messageSend = {
                clientId: "123",
                body: {
                    clinicId: clinicStored._id
                }
            }
            const expectedResult = {}
            await asyncMethod("sendAppointmentInformation", "appointmentInformationResponse", messageSend, expectedResult)
        })
    })

    describe('wipeTestData', function () {
        it('Is this wiping test database?', async function () {
            await asyncMethod('wipeTestData', 'wipeTestData', { clientId: 123, body: 'no expectation'}, {response: "Success"})
        })
    })

    //Is needed to close the runner in the CI/CD pipeline. Shouldn't be changed. Should be uncommented before going for a merge.
    describe('Closing runner', function () {
        it('Is this closing the runner?', function () {
            mqttClient.sendMessage('test', JSON.stringify({message: 'no expectation'}))
        })
    })
})
//Is needed to close the tester in the CI/CD pipeline. Shouldn't be changed. Should be uncommented before going for a merge.
after(function () {
    setTimeout(() => {
        process.exit()
    }, 5000)

});