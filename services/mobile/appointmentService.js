import moment from "moment";
import Appointment from "../../models/appointmentsModel.js";

//GET APPOINTMENT BY CUSTOMER
export const getCustomerAppointments = async (salonId, customerEmail) => {
    // const customerAppointments = await Appointment.aggregate([
    //     {
    //         $match: {
    //             salonId: salonId,
    //             "appointmentList.customerEmail": customerEmail
    //         }
    //     },
    //     {
    //         $unwind: "$appointmentList"
    //     },
    //     {
    //         $match: {
    //             "appointmentList.customerEmail": customerEmail
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$_id",
    //             appointments: { $push: "$appointmentList" }
    //         }
    //     }
    // ]);

    // if (customerAppointments.length > 0) {
    //     return customerAppointments[0].appointments;
    // } else {
    //     return [];
    // }
    const getCustomerBookingBySalonId = await Appointment.findOne({ salonId });

    if (!getCustomerBookingBySalonId) {
        return [];
    }

    const filteredAppointments = getCustomerBookingBySalonId.appointmentList
        .filter(item => item.customerEmail === customerEmail)
        .map(appointment => {
            // Convert time to 12-hour AM/PM format using moment.js
            const formatTo12Hour = (time) => moment(time, "HH:mm").format("h:mm A");

            return {
                ...appointment.toObject(),
                startTime: formatTo12Hour(appointment.startTime),
                endTime: formatTo12Hour(appointment.endTime),
                timeSlots: `${formatTo12Hour(appointment.startTime)} - ${formatTo12Hour(appointment.endTime)}`
            };
        });

    return filteredAppointments;
}

export const getAppointmentbyId = async (salonId) => {
    const appointment = await Appointment.findOne({ salonId });
    return appointment;
}

//CREATE NEW APPOINTMENT
export const createNewAppointment = async (salonId, newAppointment) => {
    const appointment = new Appointment({
        salonId: salonId,
        appointmentList: [newAppointment],
    });
    return appointment;
}

export const getAppointmentsByAppointmentId = async (salonId, appointmentId) => {
    const appointment = await Appointment.findOne({
        salonId
    })

    // Filter the appointment list to find the appointment by its ID
    const filteredAppointment = appointment.appointmentList.find(
        (appointment) => appointment._id.toString() === appointmentId
    );
    return filteredAppointment;
}


// Function to update appointment
export const updateAppointment = async (salonId, appointmentId, newData) => {
    return await Appointment.findOneAndUpdate(
        { salonId, 'appointmentList._id': appointmentId },
        {
            $set: {
                'appointmentList.$.barberId': newData.barberId,
                'appointmentList.$.services': newData.services,
                'appointmentList.$.appointmentDate': newData.appointmentDate,
                'appointmentList.$.appointmentNotes': newData.appointmentNotes,
                'appointmentList.$.startTime': newData.startTime,
                'appointmentList.$.endTime': newData.endTime,
                'appointmentList.$.timeSlots': `${newData.startTime}-${newData.endTime}`
            },
        },
        { new: true }
    );
};

//DELETE APPOINTMENT BY ID
export const deleteAppointmentById = async (salonId, appointmentId) => {
    const deleteAppointment = await Appointment.findOneAndUpdate(
        { salonId, 'appointmentList._id': appointmentId },
        {
            $pull: {
                appointmentList: { _id: appointmentId },
            },
        },
        { new: true }
    );
    return deleteAppointment;
}


//GET APPOINTMENTS BY DATE
export const getAppointmentsByDateAndBarberId = async (salonId, date, barberId) => {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.appointmentDate": {
                    $eq: new Date(date)
                },
                "appointmentList.barberId": barberId
            }
        },
        {
            $unwind: "$appointmentList"
        },
        {
            $match: {
                "appointmentList.appointmentDate": {
                    $eq: new Date(date)
                },
                "appointmentList.barberId": barberId
            }
        },
    ]);
    return appointments;
}

// GET ALL APPOINTMENTS BY SALON ID
export const allAppointmentsBySalonId = async (salonId) => {
    const appointments = await Appointment.aggregate([
        { $match: { salonId: salonId } },
        { $unwind: "$appointmentList" },
        {
            $lookup: {
                from: "barbers",
                localField: "appointmentList.barberId",
                foreignField: "barberId",
                as: "barberInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.barberName": {
                    $arrayElemAt: ["$barberInfo.name", 0]
                },

                "appointmentList.barberProfile": {
                    $arrayElemAt: ["$barberInfo.profile", 0]
                },
                "appointmentList.appointmentDate": {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$appointmentList.appointmentDate"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                "appointmentList._id": 1,
                "appointmentList.appointmentDate": 1,
                "appointmentList.appointmentNotes": 1,
                "appointmentList.startTime": 1,
                "appointmentList.endTime": 1,
                "appointmentList.timeSlots": 1,
                "appointmentList.barberName": 1,
                "appointmentList.barberProfile": 1
                // Include other fields if needed
            }
        },
        { $sort: { "appointmentList.appointmentDate": 1 } }
    ]);
    return appointments;
}


// GET ALL APPOINTMENTS BY SALON ID AND DATE
export const allAppointmentsBySalonIdAndDate = async (salonId, appointmentDate) => {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                }
            }
        },
        {
            $unwind: "$appointmentList"
        },
        {
            $match: {
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                }
            }
        },
        {
            $lookup: {
                from: "barbers",
                localField: "appointmentList.barberId",
                foreignField: "barberId",
                as: "barberInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.barberName": {
                    $arrayElemAt: ["$barberInfo.name", 0]
                },
                "appointmentList.background": "#FFFFFF", // Set your default color here
                "appointmentList.startTime": "$appointmentList.startTime",
                "appointmentList.endTime": "$appointmentList.endTime",
                "appointmentList.appointmentDate": {
                    $dateToString: { format: "%Y-%m-%d", date: "$appointmentList.appointmentDate" }
                }
            }
        },
        {
            $group: {
                _id: "$appointmentList.barberId",
                barbername: { $first: "$appointmentList.barberName" },
                appointments: { $push: "$appointmentList" }
            }
        },
        {
            $project: {
                barbername: 1,
                appointments: 1,
                _id: 0
            }
        },
        {
            $sort: {
                barbername: 1 // Sort by barberName in ascending order
            }
        }
    ]);
    return appointments;
}


// GET ALL APPOINTMENTS BY BARBER ID
export const allAppointmentsByBarberId = async (salonId, barberId) => {
    const appointments = await Appointment.aggregate([
        { $match: { salonId: salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": barberId
            }
        },
        {
            $lookup: {
                from: "barbers",
                localField: "appointmentList.barberId",
                foreignField: "barberId",
                as: "barberInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.barberName": {
                    $arrayElemAt: ["$barberInfo.name", 0]
                },
                "appointmentList.appointmentDate": {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$appointmentList.appointmentDate"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                "appointmentList._id": 1,
                "appointmentList.appointmentDate": 1,
                "appointmentList.appointmentName": 1,
                "appointmentList.startTime": 1,
                "appointmentList.endTime": 1,
                "appointmentList.timeSlots": 1,
                "appointmentList.barberName": 1
                // Include other fields if needed
            }
        },
        { $sort: { "appointmentList.appointmentDate": 1 } }
    ]);
    return appointments;
}


// GET ALL APPOINTMENTS BY BARBER ID AND DATE
export const allAppointmentsByBarberIdAndDate = async (salonId, barberId, appointmentDate) => {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                },
                "appointmentList.barberId": barberId
            }
        },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                },
                "appointmentList.barberId": barberId
            }
        },
        {
            $lookup: {
                from: "barbers",
                localField: "appointmentList.barberId",
                foreignField: "barberId",
                as: "barberInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.barberName": {
                    $arrayElemAt: ["$barberInfo.name", 0]
                }
            }
        },
        {
            $group: {
                _id: "$appointmentList.barberId",
                barbername: { $first: "$appointmentList.barberName" },
                appointments: { $push: "$appointmentList" }
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                barbername: 1,
                barberId: 1,
                appointments: 1
            }
        }
    ]);
    return appointments;
}
