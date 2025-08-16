import Appointment from "../../../models/appointmentsModel.js";
import { ObjectId } from 'mongodb';


//GET APPOINTMENT BY ID
export const getAppointmentbySalonId = async (salonId) => {
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

//UPDATE APPOINTMENT BY ID
export const updateAppointmentById = async (salonId, appointmentId, updateFields) => {
    const {
        barberId,
        serviceIds,
        appointmentDate,
        appointmentNotes,
        startTime,
        endTime,
    } = updateFields

    const updatedAppointment = await Appointment.findOneAndUpdate(
        { salonId, 'appointmentList._id': appointmentId },
        {
            $set: {
                'appointmentList.$.barberId': barberId,
                'appointmentList.$.serviceId': serviceIds,
                'appointmentList.$.appointmentDate': appointmentDate,
                'appointmentList.$.appointmentNotes': appointmentNotes,
                'appointmentList.$.startTime': startTime,
                'appointmentList.$.endTime': endTime,
                'appointmentList.$.timeSlots': `${startTime}-${endTime}`
                // Update other fields as needed
            },
        },
        { new: true }
    );

    // Return the updated appointment
    return updatedAppointment;
}

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
                "appointmentList.customerEmail": 1,
                "appointmentList.customerName": 1,
                "appointmentList.timeSlots": 1,
                "appointmentList.barberName": 1,
                "appointmentList.barberId": 1

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
        // Match appointments based on salonId and appointmentDate
        {
            $match: {
                salonId: salonId,
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                }
            }
        },
        // Unwind the appointmentList array for individual processing
        {
            $unwind: "$appointmentList"
        },
        // Match again to filter based on appointmentDate
        {
            $match: {
                "appointmentList.appointmentDate": {
                    $eq: new Date(appointmentDate)
                }
            }
        },
        // Lookup barber information
        {
            $lookup: {
                from: "barbers",
                localField: "appointmentList.barberId",
                foreignField: "barberId",
                as: "barberInfo"
            }
        },
        // Lookup customer information
        {
            $lookup: {
                from: "customers", // Replace with your customers collection name
                localField: "appointmentList.customerEmail",
                foreignField: "email", // Adjust to the field in customers that matches customerEmail
                as: "customerInfo"
            }
        },
        // Lookup salon information
        {
            $lookup: {
                from: "salons",
                localField: "salonId",
                foreignField: "salonId",
                as: "salonInfo"
            }
        },
        // Add necessary fields and map services with service icons
        {
            $addFields: {
                "appointmentList.barberName": {
                    $arrayElemAt: ["$barberInfo.name", 0]
                },
                "appointmentList.barberProfile": {
                    $arrayElemAt: ["$barberInfo.profile", 0]
                },
                "appointmentList.customerProfile": {
                    $ifNull: [
                        { $arrayElemAt: ["$customerInfo.profile", 0] },
                        [
                            {
                                "url": "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg",
                            }
                        ]
                    ]
                },
                // Map services to include service icons
                "appointmentList.services": {
                    $map: {
                        input: "$appointmentList.services",
                        as: "service",
                        in: {
                            serviceId: "$$service.serviceId",
                            serviceName: "$$service.serviceName",
                            servicePrice: "$$service.servicePrice",
                            barberServiceEWT: "$$service.barberServiceEWT",
                            serviceIcon: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: { $arrayElemAt: ["$salonInfo.services", 0] },
                                                    as: "salonService",
                                                    cond: { $eq: ["$$salonService.serviceId", "$$service.serviceId"] }
                                                }
                                            },
                                            as: "matchedService",
                                            in: "$$matchedService.serviceIcon"
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                },
                "appointmentList.background": "#FFFFFF", // Default background color
                "appointmentList.startTime": "$appointmentList.startTime",
                "appointmentList.endTime": "$appointmentList.endTime",
                "appointmentList.appointmentDate": {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$appointmentList.appointmentDate"
                    }
                }
            }
        },
        // Group by barberId
        {
            $group: {
                _id: "$appointmentList.barberId",
                barbername: { $first: "$appointmentList.barberName" },
                barberProfile: { $first: "$appointmentList.barberProfile" },
                barberId: { $first: "$appointmentList.barberId" },
                appointments: { $push: "$appointmentList" }
            }
        },
        // Project the final output
        {
            $project: {
                barbername: 1,
                barberProfile: 1,
                barberId: 1,
                appointments: {
                    barberId: 1,
                    appointmentNotes: 1,
                    appointmentDate: 1,
                    services: 1,
                    startTime: 1,
                    endTime: 1,
                    timeSlots: 1,
                    customerEmail: 1,
                    customerName: 1,
                    customerProfile: 1,
                    customerType: 1,
                    methodUsed: 1,
                    _id: 1,
                    background: 1
                },
                _id: 0
            }
        },
        // Sort by barbername in ascending order
        {
            $sort: {
                barbername: 1
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


export const allAppointmentsByBarberIdAndDate = async (salonId, barberId) => {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.barberId": barberId
            }
        },
        {
            $unwind: "$appointmentList"
        },
        {
            $match: {
                "appointmentList.barberId": barberId
            }
        },
        {
            // Lookup customer information from the "customers" collection
            $lookup: {
                from: "customers", // Replace with your customers collection name
                localField: "appointmentList.customerEmail", // Match customerEmail from appointments
                foreignField: "email", // Match this field in the customers collection
                as: "customerInfo" // Output the result to customerInfo
            }
        },
        {
            $addFields: {
                "appointmentList.customerProfile": {
                    $ifNull: [
                        { $arrayElemAt: ["$customerInfo.profile", 0] },
                        [
                            {
                                "url": "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg",
                            }
                        ]
                    ]
                },
            }
        },
        {
            $group: {
                _id: "$appointmentList.appointmentDate", // Group by appointment date
                appointmentDate: {
                    $first: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Format to remove time and only keep date
                            date: "$appointmentList.appointmentDate"
                        }
                    }
                },
                appointments: { $push: "$appointmentList" } // Push all appointments for the group
            }
        },
        {
            $addFields: {
                appointments: {
                    $map: {
                        input: "$appointments",
                        as: "appointment",
                        in: {
                            $mergeObjects: [
                                "$$appointment",
                                {
                                    appointmentDate: {
                                        $dateToString: {
                                            format: "%Y-%m-%d", // Format to remove time and only keep date
                                            date: "$$appointment.appointmentDate"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                appointmentDate: 1, // Include the formatted appointmentDate
                appointments: {
                    barberId: 1,
                    appointmentNotes: 1,
                    appointmentDate: 1,
                    services: 1,
                    startTime: 1,
                    endTime: 1,
                    timeSlots: 1,
                    customerEmail: 1,
                    customerName: 1,
                    customerProfile: 1,
                    customerType: 1,
                    methodUsed: 1,
                    _id: 1,
                    background: 1
                },
                _id: 0
            }
        },
        {
            $sort: {
                appointmentDate: 1
            }
        }
    ]);

    return appointments;
}





//GET DASHBOARD APPOINTMENT LIST 
export const dashboardAppointmentList = async (salonId, appointmentDate) => {
    const appointmentList = await Appointment.aggregate([
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
                "appointmentList.endTime": "$appointmentList.endTime"
            }
        },
        {
            $project: {
                _id: 0, // Exclude MongoDB generated _id field
                barberId: "$appointmentList.barberId",
                serviceId: "$appointmentList.serviceId",
                appointmentName: "$appointmentList.appointmentName",
                appointmentDate: {
                    $dateToString: {
                        format: "%Y-%m-%d", // Format the date as YYYY-MM-DD
                        date: "$appointmentList.appointmentDate"
                    }
                },

                startTime: "$appointmentList.startTime",
                endTime: "$appointmentList.endTime",
                timeSlots: {
                    $concat: ["$appointmentList.startTime", "-", "$appointmentList.endTime"]
                },
                customerName: "$appointmentList.customerName",
                customerType: "$appointmentList.customerType",
                methodUsed: "$appointmentList.methodUsed",
                barberName: "$appointmentList.barberName",
                background: "$appointmentList.background"
            }
        },
        {
            $sort: {
                barberName: 1 // Sort by barberName in ascending order
            }
        }
    ]);

    return appointmentList;
}


//GET APPOINTMENT BY CUSTOMER
export const getCustomerAppointments = async (salonId, customerEmail) => {
    const customerAppointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.customerEmail": customerEmail
            }
        },
        {
            $unwind: "$appointmentList"
        },
        {
            $match: {
                "appointmentList.customerEmail": customerEmail
            }
        },
        {
            $group: {
                _id: "$_id",
                appointments: { $push: "$appointmentList" }
            }
        }
    ]);

    if (customerAppointments.length > 0) {
        return customerAppointments[0].appointments;
    } else {
        return [];
    }
}


export const findAppointmentById = async (_id, barberId, appointmentDate, salonId) => {
    const appointment = await Appointment.findOne(
        {
            salonId,
            appointmentList: {
                $elemMatch: {
                    _id: _id,
                    barberId: barberId,
                    appointmentDate: new Date(appointmentDate),
                },
            },
        },
        { "appointmentList.$": 1 } // Project only the matching element
    );

    return appointment;
};

//PULL SERVED APPOINTMENT 
export const servedOrcancelAppointment = async (_id, barberId, appointmentDate, salonId) => {
    const appointment = await Appointment.findOneAndUpdate(
        { salonId },
        {
            $pull: {
                'appointmentList': {
                    _id: _id,
                    barberId: barberId,
                    appointmentDate: appointmentDate,
                },
            },
        },
        { new: true }
    );
    return appointment;
}


export const getAllAppointmentsByBarberIdAndSalonId = async (salonId, barberId, appointmentDate) => {
    const barberAppointments = await Appointment.findOne({ salonId })

    if (!barberAppointments || !barberAppointments.appointmentList) {
        return []; // Return an empty array if no data found
    }

    // Filter appointments for the specific barber and appointment date
    const filteredAppointments = barberAppointments.appointmentList.filter(appointment =>
        appointment.barberId === barberId &&
        new Date(appointment.appointmentDate).toISOString() === new Date(appointmentDate).toISOString()
    );

    return filteredAppointments;
}

export const cancelAppointmentByBarber = async (salonId, filteredAppointments) => {
    // After filtering appointments, use the IDs to perform the actual deletion in the DB
    const updatedAppointmentList = await Appointment.updateOne(
        {
            salonId, // Match the document by salonId
            "appointmentList._id": { $in: filteredAppointments.map(appointment => appointment._id) } // Match appointments to cancel by their _id in appointmentList
        },
        {
            $pull: {
                appointmentList: { _id: { $in: filteredAppointments.map(appointment => appointment._id) } } // Remove the filtered appointments
            }
        }
    );

    return updatedAppointmentList
};



// GET ALL APPOINTMENTS BY BARBER IDS
export const allAppointmentsByMultipleBarberIds = async (salonId, barberIds) => {
    const appointments = await Appointment.aggregate([
        { $match: { salonId: salonId } },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": { $in: barberIds } // Match multiple barberIds
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
                "appointmentList.barberName": 1,
                "appointmentList.barberId": 1
            }
        },
        { $sort: { "appointmentList.appointmentDate": 1 } }
    ]);
    return appointments;
}


// GET ALL APPOINTMENTS BY MULTIPLE BARBER IDS AND DATE
export const allAppointmentsByMultipleBarberIdsAndDate = async (salonId, barberIds, appointmentDate) => {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.barberId": { $in: barberIds } // Match multiple barberIds
            }
        },
        {
            $unwind: "$appointmentList"
        },
        {
            $match: {
                "appointmentList.barberId": { $in: barberIds },
                "appointmentList.appointmentDate": {
                    $gte: new Date(`${appointmentDate}T00:00:00.000Z`),
                    $lt: new Date(`${appointmentDate}T23:59:59.999Z`)
                }
            }
        },
        {
            // Lookup customer information from the "customers" collection
            $lookup: {
                from: "customers",
                localField: "appointmentList.customerEmail",
                foreignField: "email",
                as: "customerInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.customerProfile": {
                    $ifNull: [
                        { $arrayElemAt: ["$customerInfo.profile", 0] },
                        [
                            {
                                "url": "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"
                            }
                        ]
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$appointmentList.appointmentDate", // Group by appointment date
                appointmentDate: {
                    $first: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$appointmentList.appointmentDate"
                        }
                    }
                },
                appointments: { $push: "$appointmentList" }
            }
        },
        {
            $addFields: {
                appointments: {
                    $map: {
                        input: "$appointments",
                        as: "appointment",
                        in: {
                            $mergeObjects: [
                                "$$appointment",
                                {
                                    appointmentDate: {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$$appointment.appointmentDate"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                appointmentDate: 1,
                appointments: {
                    barberId: 1,
                    appointmentNotes: 1,
                    appointmentDate: 1,
                    services: 1,
                    startTime: 1,
                    endTime: 1,
                    timeSlots: 1,
                    customerEmail: 1,
                    customerName: 1,
                    customerProfile: 1,
                    customerType: 1,
                    methodUsed: 1,
                    _id: 1,
                    background: 1
                }
            }
        }
    ]);

    return appointments;
}



export const todayAppointmentsByBarberId = async (salonId, barberId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Next day at 00:00:00

    const appointments = await Appointment.aggregate([
        {
            $match: {
                salonId: salonId,
                "appointmentList.barberId": barberId
            }
        },
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": barberId,
                "appointmentList.appointmentDate": { $gte: today, $lt: tomorrow } // Filter for today
            }
        },
        {
            $lookup: {
                from: "customers",
                localField: "appointmentList.customerEmail",
                foreignField: "email",
                as: "customerInfo"
            }
        },
        {
            $lookup: {
                from: "barbers", // Join with barbers collection
                localField: "appointmentList.barberId",
                foreignField: "barberId", // Assuming barberId is stored as ObjectId in barbers collection
                as: "barberInfo"
            }
        },
        {
            $addFields: {
                "appointmentList.customerProfile": {
                    $ifNull: [
                        { $arrayElemAt: ["$customerInfo.profile", 0] },
                        [
                            {
                                url: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg"
                            }
                        ]
                    ]
                },
                "appointmentList.barberName": { $arrayElemAt: ["$barberInfo.name", 0] } // Extract barber name

            }
        },
        {
            $project: {
                _id: 0,
                barberId: "$appointmentList.barberId",
                barberName: "$appointmentList.barberName", // Include barber name in output
                appointmentNotes: "$appointmentList.appointmentNotes",
                appointmentDate: {
                    $dateToString: {
                        format: "%d %b %Y", // Format as "dd MMM yyyy"
                        date: "$appointmentList.appointmentDate"
                    }
                },
                startTime: "$appointmentList.startTime",
                endTime: "$appointmentList.endTime",
                timeSlots: "$appointmentList.timeSlots",
                customerEmail: "$appointmentList.customerEmail",
                customerName: "$appointmentList.customerName",
                customerType: "$appointmentList.customerType",
                methodUsed: "$appointmentList.methodUsed",
                _id: "$appointmentList._id",
                background: "$appointmentList.background",
                services: "$appointmentList.services",
                customerProfile: "$appointmentList.customerProfile"
            }
        }
    ]);

    return {
        totalCount: appointments.length,
        appointments
    };
};



