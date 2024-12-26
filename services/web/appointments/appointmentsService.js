import Appointment from "../../../models/appointmentsModel.js";


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
            $lookup: {
                from: "customers", // Replace with your customers collection name
                localField: "appointmentList.customerEmail",
                foreignField: "email", // Adjust to the field in customers that matches customerEmail
                as: "customerInfo"
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
            "appointmentList.barberId": {
                $arrayElemAt: ["$barberInfo.barberId", 0]
            },
            "appointmentList.customerProfile": {
                $arrayElemAt: ["$customerInfo.profile", 0] // Assuming `profile` exists in customers collection
            },
                "appointmentList.background": "#FFFFFF", // Set your default color here
                "appointmentList.startTime": "$appointmentList.startTime",
                "appointmentList.endTime": "$appointmentList.endTime"
            }
        },
        {
            $group: {
                _id: "$appointmentList.barberId",
                barbername: { $first: "$appointmentList.barberName" },
                barberProfile:{$first: "$appointmentList.barberProfile"},
                barberId:{$first: "$appointmentList.barberId"},
                customerProfile:{$first: "$appointmentList.customerProfile"},
                appointments: { $push: "$appointmentList" }
            }
        },
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
        {
            $sort: {
                barbername: 1 // Sort by barberName in ascending order
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


  // GET ALL APPOINTMENTS BY BARBER ID AND DATE
  export const allAppointmentsByBarberIdAndDate = async(salonId, barberId, appointmentDate) => {
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
 export const servedAppointment = async(_id, barberId, appointmentDate, salonId) =>{
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