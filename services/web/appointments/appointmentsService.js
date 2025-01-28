import Appointment from "../../../models/appointmentsModel.js";
import { ObjectId } from 'mongodb';


//GET APPOINTMENT BY ID
export const getAppointmentbySalonId = async(salonId)=>{
    const appointment = await Appointment.findOne({ salonId });
    return appointment;
 }

 

//CREATE NEW APPOINTMENT
export const createNewAppointment = async(salonId, newAppointment) => {
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
 export const deleteAppointmentById = async(salonId, appointmentId) => {
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
 export const getAppointmentsByDateAndBarberId = async(salonId, date, barberId) =>{
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
 export const allAppointmentsBySalonId = async(salonId) => {
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
                "appointmentList.barberName": 1
                // Include other fields if needed
            }
        },
        { $sort: { "appointmentList.appointmentDate": 1 } }
    ]);
    return appointments;
 }

  // GET ALL APPOINTMENTS BY SALON ID AND DATE
 export const allAppointmentsBySalonIdAndDate = async(salonId, appointmentDate ) => {

    // const appointments = await Appointment.findOne({ salonId }).lean();

    // if (appointments) {
    //     // Modify the appointment list structure if needed
    //     const modifyAppointmentList = appointments.appointmentList.map((appointment) => ({
    //         // barberName: appointment.barberName,
    //         appointments: [
    //             {
    //                 barberId: appointment.barberId,
    //                 // serviceId: appointment.serviceId,
    //                 appointmentNotes: appointment.appointmentNotes,
    //                 appointmentDate: appointment.appointmentDate,
    //                 startTime: appointment.startTime,
    //                 endTime: appointment.endTime,
    //                 timeSlots: `${appointment.startTime}-${appointment.endTime}`,
    //                 customerEmail: appointment.customerEmail,
    //                 customerName: appointment.customerName,
    //                 customerType: appointment.customerType,
    //                 methodUsed: appointment.methodUsed,
    //                 _id: appointment._id,
    //                 background: appointment.background || "#FFFFFF" // Default background color
    //             }
    //         ]
    //     }));
    
    //     if (modifyAppointmentList) {
    //         const filteredAppointmentList = modifyAppointmentList.filter(item => item.appointments.a === appointmentDate);
        
    //         return filteredAppointmentList
    //       }

    //     console.log(modifyAppointmentList)
    
    //     // return filteredAppointmentList;
    // }

    
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
                        "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg" // Default image URL
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
  export const allAppointmentsByBarberId = async(salonId, barberId) => {
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
        { $unwind: "$appointmentList" },
        {
            $match: {
                "appointmentList.barberId": barberId
            }
        },
        {
            $group: {
                _id: "$appointmentList.appointmentDate", // Group by appointment date
                appointmentDate: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentList.appointmentDate" } } }, // Extract date without time
                appointments: { $push: "$appointmentList" } // Push all appointments for the group
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                appointmentDate: 1, // Include the formatted appointmentDate
                appointments: 1 // Include the appointments array
            }
        }
    ]);

    return appointments;
}



 //GET DASHBOARD APPOINTMENT LIST 
 export const dashboardAppointmentList = async(salonId, appointmentDate) => {
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
 export const getCustomerAppointments = async(salonId, customerEmail) =>{
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
 export const servedOrcancelAppointment = async(_id, barberId, appointmentDate, salonId) =>{
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
        {new: true}
    );
    return appointment;
 }


 export const getAllAppointmentsByBarberIdAndSalonId = async(salonId, barberId, appointmentDate) => {
    const barberAppointments = await Appointment.findOne({salonId})

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

 export const cancelAppointmentByBarber = async (salonId,filteredAppointments) => {
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