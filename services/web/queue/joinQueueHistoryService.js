import JoinedQueueHistory from "../../../models/joinQueueHistoryModel.js"

// FIND SALON IN HISTORY
export const findSalonQueueListHistory = async(salonId) => {
  const salon = await JoinedQueueHistory.findOne({ salonId });
  return salon;
}

//ADD SERVED Q TO HISTORY
export const addQueueHistory = async(salonId, element, updatedByBarberEmail,servedByBarberEmail, barberId, name, isAdmin) => {

  const newElement = {
    ...element.toObject(), // Convert Mongoose document to plain JavaScript object
    servedByBarberEmail: servedByBarberEmail,
    updatedByBarberEmail: updatedByBarberEmail,
    barberId: barberId,
    barberName: name,
    isAdmin: isAdmin
};

const newSalonHistory = new JoinedQueueHistory({
  salonId,
  queueList: [newElement],
});
await newSalonHistory.save();
}


export const addQueueHistoryWhenCanceled = async(salonId, canceledQueue, updatedByBarberEmail) => {

  const newElement = {
    ...canceledQueue.toObject(), // Convert Mongoose document to plain JavaScript object
    updatedByBarberEmail,
};


   const salon = new JoinedQueueHistory({
        salonId,
        queueList: [newElement],
      });

      return salon;
 }

//UPDATE THE STATUS FIELD IF SERVED
export const updateServed = async(salonId, _id) => {
  const updatedValue =   await JoinedQueueHistory.updateOne(
      { salonId, 'queueList._id': _id },
      { $set: { 'queueList.$.status': 'served' } }
    );
    return updatedValue;
}

//UPDATE THE STATUS FIELD IF CANCELED
export const statusCancelQ = async(salonId, _id) => {
  const updatedValue =   await JoinedQueueHistory.updateOne(
      { salonId, 'queueList._id': _id },
      { $set: { 'queueList.$.status': 'cancelled' } }
    );
    return updatedValue;
}

//GET Q HISTORY BY CUSTOMER EMAIL 
export const qhistoryByCustomer = async(salonId, customerEmail) => {
  const qHistory = await JoinedQueueHistory.aggregate([
      {
          $match: {
              salonId: salonId,
          },
      },
      {
          $unwind: "$queueList",
      },
      {
          $match: {
              'queueList.customerEmail': customerEmail,
          },
      },
  ]);
return qHistory;  
}

//Reports served Q list
export const getSalonServedQlist = async (salonId, fromDate, toDate) => {
  // Parse the input dates, they should be in ISO format.
  const from = new Date(fromDate);
  from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
  const to = new Date(toDate);
  to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

  const qHistory = await JoinedQueueHistory.aggregate([
      {
          $match: {
              salonId: salonId,
              'queueList.dateJoinedQ': {
                  $gte: from, // Compare in UTC
                  $lte: to    // Compare in UTC
              }
          }
      },
      {
          $unwind: "$queueList"
      },
      {
          $match: {
              'queueList.status': "served",
          }
      },
      {
          $group: {
              _id: {
                  date: {
                      $dateToString: { format: "%Y-%m-%d", date: "$queueList.dateJoinedQ" } // Group by day
                  }
              },
              count: { $sum: 1 } // Count the number of served customers per day
          }
      },
      {
          $sort: { "_id.date": 1 } // Sort by date ascending
      }
  ]);

  // Fill in missing dates with count 0 (optional)
  const result = await fillMissingDates(qHistory, from, to);

  return result;
};

//Reports cancelled q list
export const getSalonCancelledQlist = async (salonId, fromDate, toDate) => {
  // Parse the input dates, they should be in ISO format.
  const from = new Date(fromDate);
  from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
  const to = new Date(toDate);
  to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

  const qHistory = await JoinedQueueHistory.aggregate([
      {
          $match: {
              salonId: salonId,
              'queueList.dateJoinedQ': {
                  $gte: from, // Compare in UTC
                  $lte: to    // Compare in UTC
              }
          }
      },
      {
          $unwind: "$queueList"
      },
      {
          $match: {
              'queueList.status': "cancelled",
          }
      },
      {
          $group: {
              _id: {
                  date: {
                      $dateToString: { format: "%Y-%m-%d", date: "$queueList.dateJoinedQ" } // Group by day
                  }
              },
              count: { $sum: 1 } // Count the number of served customers per day
          }
      },
      {
          $sort: { "_id.date": 1 } // Sort by date ascending
      }
  ]);

  // Fill in missing dates with count 0 (optional)
  const result = await fillMissingDates(qHistory, from, to);

  return result;
};


export const getBarberServedQlist = async (salonId, barberId, fromDate, toDate) => {
  // Parse the input dates, they should be in ISO format.
  const from = new Date(fromDate);
  from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
  const to = new Date(toDate);
  to.setUTCHours(23, 59, 59, 999); // End of the day in UTC

  const qHistory = await JoinedQueueHistory.aggregate([
      {
          $match: {
              salonId: salonId,
              'queueList.dateJoinedQ': {
                  $gte: from, // Compare in UTC
                  $lte: to    // Compare in UTC
              },
              'queueList.barberId': barberId // Add barberId check
          }
      },
      {
          $unwind: "$queueList"
      },
      {
          $match: {
              'queueList.status': "served",
          }
      },
      {
          $group: {
              _id: {
                  date: {
                      $dateToString: { format: "%Y-%m-%d", date: "$queueList.dateJoinedQ" } // Group by day
                  }
              },
              count: { $sum: 1 } // Count the number of served customers per day
          }
      },
      {
          $sort: { "_id.date": 1 } // Sort by date ascending
      }
  ]);

  // Fill in missing dates with count 0 (optional)
  const result = await fillMissingDates(qHistory, from, to);

  return result;
};

export const getSalonQueueHistory = async(salonId) => {
    const salonQueueListHistory = await JoinedQueueHistory.findOne({salonId})

    if (!salonQueueListHistory || !salonQueueListHistory.queueList || salonQueueListHistory.queueList.length === 0) {
        return [];
    }

      return salonQueueListHistory.queueList
} 

export const getQueueHistoryByBarber = async(salonId, barberId) => {
    const barberQueuelisthistory = await JoinedQueueHistory.findOne({salonId});


    if(barberQueuelisthistory){
        const filteredQueueList = barberQueuelisthistory.queueList.filter(item => item.barberId === barberId);
      
        return filteredQueueList
      }

}