import JoinedQueueHistory from "../../models/joinQueueHistoryModel.js"

// FIND SALON IN HISTORY
export const findSalonQueueListHistory = async(salonId) => {
    const salon = await JoinedQueueHistory.findOne({ salonId });
    return salon;
}

export const addQueueHistoryWhenCanceled = async(salonId, canceledQueue) => {

    const newElement = {
      ...canceledQueue.toObject(), // Convert Mongoose document to plain JavaScript object
  };
  
  
     const salon = new JoinedQueueHistory({
          salonId,
          queueList: [newElement],
        });
  
        return salon;
   }

//UPDATE THE STATUS FIELD IF CANCELED
export const statusCancelQ = async(salonId, _id) => {
    const updatedValue =   await JoinedQueueHistory.updateOne(
        { salonId, 'queueList._id': _id },
        { $set: { 'queueList.$.status': 'cancelled' } }
      );
      return updatedValue;
}
