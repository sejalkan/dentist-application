import './ViewAppointments.css'
import React, {useEffect, useRef, useState} from "react";
import {MDBRow, MDBCol} from 'mdb-react-ui-kit';
import TimeslotCard from './components/timeslotCard'
import mqttHandler from "../common_components/MqttHandler";


export default function WithHeaderExample() {

    const [client, setClient] = useState(null);
    const [appointments, setAppointments] = useState([]);
// Primary client generating effect
    useEffect(() => {
        if (client === null) {
            setClient(mqttHandler.getClient(client))
        }
    }, [client])

// Secondary effect containing all message logic and closure state
    useEffect(() => {
        if (client !== null) {
            client.subscribe(client.options.clientId + '/#')
            client.publish('sendAppointmentInformation', JSON.stringify({
                id: client.options.clientId,
                body: {
                    clinicID: "6391e39a3e08ac910fbede6f"
                }
            }))
            client.on('message', function (topic, message) {
                switch (topic) {
                    case client.options.clientId + '/appointmentInformationResponse':
                        console.log(JSON.parse(message))
                        const pMessage = JSON.parse(message)
                        setAppointments(pMessage)
                        break;
                    default:
                        (new Error("The wrong message is received"))
                        break;
                }
            })
        }
        return () => {

            if (client !== null) {
                console.log("ending process");
                client.end()
            }
        }
    }, [client])

    return (
        <div id="ty">
            <div id="background">
                <MDBRow>
                    <MDBCol md='3'>
                        <div className="card">
                            <div className="card-body">
                                <h3 id={"currentAppointments"}> Current appointments </h3>
                                <img className="clinic"
                                     src="https://cdn-icons-png.flaticon.com/512/2317/2317964.png"
                                     alt="clinic"/>
                            </div>
                        </div>
                    </MDBCol>
                    <MDBCol md='8'>
                        <div id={"timeslots"}>
                            {Array.from(appointments).map((appointment) => (
                                    <TimeslotCard key={appointment.id} appointment={appointment}/>
                            ))}
                        </div>
                    </MDBCol>
                </MDBRow>
            </div>
        </div>
    );
}
