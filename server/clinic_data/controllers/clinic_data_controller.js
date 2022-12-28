const mongooseHandler = require('../../helpers/mongoose_handler')
const clinicSchema = require('../../helpers/schemas/clinic')
let config
try {
    config = require('../../helpers/config-server');
} catch (e) {
    config = require('../../helpers/dummy_config')
}
const bcrypt = require('bcrypt');
const {compare} = require("bcrypt");

// Connect to MongoDB
let mongooseClient = new mongooseHandler(config.module_config.clinicUser.mongoURI)
mongooseClient.connect().then(() => {
    createModels()
}, null)

let clinicModel

function reconnect(mongoURI) {
    mongooseClient.close()
    mongooseClient = new mongooseHandler(mongoURI)
    mongooseClient.connect().then(() => {
        createModels()
    }, null)
}

function createModels() {
    clinicModel = mongooseClient.model('clinic', clinicSchema)
}

async function mapDataRequest() {

    let clinicMapJSON = {
        clinics: []
    }

    let clinicErrorFlag = false
    const clinics = await clinicModel.find()
    try {

        clinics.forEach(clinic => {

            let openingHourString

            if(clinic.openingHours.monday.start) {
                openingHourString = "Opening Hours: " +
                    "\nMonday: " + clinic.openingHours.monday.start + " - " + clinic.openingHours.monday.end +
                    "\nTuesday: " + clinic.openingHours.tuesday.start + " - " + clinic.openingHours.tuesday.end +
                    "\nWednesday: " + clinic.openingHours.wednesday.start + " - " + clinic.openingHours.wednesday.end +
                    "\nThursday: " + clinic.openingHours.thursday.start + " - " + clinic.openingHours.thursday.end +
                    "\nFriday : " + clinic.openingHours.friday.start + " - " + clinic.openingHours.friday.end
            }else {
                openingHourString = "No opening hours given"
            }
            clinicMapJSON.clinics.push({
                coordinates: [clinic.coordinates.longitude, clinic.coordinates.latitude],
                properties: {
                    title: clinic.name,
                    address: "Address: " + clinic.address,
                    opening_hours: openingHourString

                }
            })
        })
        if (!clinicErrorFlag) {
            return clinicMapJSON
        } else {
            return clinicErrorFlag
        }
    } catch (err) {
        console.log(err)
    }
}

/**
 * Checks if the email provided already exists in the database.
 * @param email The email provided
 * @returns {Promise<boolean>} returns true if it was found in the database, false if not
 */
async function emailExists(email) {
    const clinic = await clinicModel.findOne({email: email});
    if (clinic) {
        return true
    }
}

/**
 * Find the correct clinic using the email provided in the body, then changes the clinic's information
 * with the provided information in the body. If there is none, it keeps the old information.
 * @param req the message received from the frontend, consisting of the body and user's input.
 * @returns {Promise<string>} The status and the response text.
 */
async function editInfo(req) {
    const email = req.body.email
    console.log(email)
    const clinic = await clinicModel.findOne({email})
    let message;
    if (clinic) {
        if (await emailExists(req.body.newEmail)) {
            message = {
                status: 400,
                text: 'Email is already used!'
            }
        } else {
            clinic.name = req.body.name || clinic.name;
            clinic.owner = req.body.owner || clinic.owner;
            clinic.address = req.body.address || clinic.address;
            clinic.email = req.body.newEmail || clinic.email;
            clinic.openingHours.monday.start = req.body.openingHours.monday.start || clinic.openingHours.monday.start;
            clinic.openingHours.monday.end = req.body.openingHours.monday.end || clinic.openingHours.monday.end;
            clinic.openingHours.tuesday.start = req.body.openingHours.tuesday.start || clinic.openingHours.tuesday.start;
            clinic.openingHours.tuesday.end = req.body.openingHours.tuesday.end || clinic.openingHours.tuesday.end;
            clinic.openingHours.wednesday.start = req.body.openingHours.wednesday.start || clinic.openingHours.wednesday.start;
            clinic.openingHours.wednesday.end = req.body.openingHours.wednesday.end || clinic.openingHours.wednesday.end;
            clinic.openingHours.thursday.start = req.body.openingHours.thursday.start || clinic.openingHours.thursday.start;
            clinic.openingHours.thursday.end = req.body.openingHours.thursday.end || clinic.openingHours.thursday.end;
            clinic.openingHours.friday.start = req.body.openingHours.friday.start || clinic.openingHours.friday.start;
            clinic.openingHours.friday.end = req.body.openingHours.friday.end || clinic.openingHours.friday.end;
            clinic.fikaHour = req.body.fikaHour || clinic.fikaHour;
            clinic.lunchHour = req.body.lunchHour || clinic.lunchHour;
            clinic.save();
            console.log("successfully updated")
            console.log(clinic)
            message = {
                status: 200,
                text: 'Successfully updated!'
            }
        }
    } else {
        message = {
            status: 404,
            text: 'Clinic not found!'
        }
    }
    return JSON.stringify(message);
}

/**
 * Finds the correct clinic using the email provided in the body.
 * Then validates the old password. If valid, the password is changed.
 * If invalid, it is communicated to the frontend.
 * @param req the message from the frontend, including the body, old password and new password.
 * @returns {Promise<string>} A status and a response text.
 */
async function changePassword(req) {
    const email = req.body.email
    console.log(email)
    const clinic = await clinicModel.findOne({email})
    console.log(clinic)
    let message;
    if (clinic) {
        if (await bcrypt.compare(req.body.oldPassword, clinic.password)) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            clinic.password = hashedPassword;
            clinic.save();
            console.log("password changed");
            console.log(clinic)
            message = {
                status: 200,
                text: 'Successfully updated!'
            }
        } else {
            message = {
                status: 400,
                text: 'Old password is incorrect!'
            }
        }
    } else {
        message = {
            status: 404,
            text: 'Clinic not found!'
        }
    }
    return JSON.stringify(message);
}

const clinicController = {
    mapDataRequest,
    reconnect,
    editInfo,
    changePassword
}

module.exports = clinicController