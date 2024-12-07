import JoinedQueueHistory from "../../../models/joinQueueHistoryModel.js"


// FIND SALON IN HISTORY
export const findSalonQueueListHistory = async(salonId) => {
    const salon = await JoinedQueueHistory.findOne({ salonId });
    return salon;
}

//ADD SERVED Q TO HISTORY
export const addQueueHistory = async(salonId, element,updatedByBarberEmail, servedByBarberEmail, barberId, name) => {

  const newElement = {
    ...element.toObject(), // Convert Mongoose document to plain JavaScript object
   servedByBarberEmail: servedByBarberEmail,
   updatedByBarberEmail: updatedByBarberEmail,
   barberId: barberId,
   barberName: name
};

    const newSalonHistory = new JoinedQueueHistory({
        salonId,
        queueList: [newElement],
      });
      await newSalonHistory.save();
}

//UPDATE THE STATUS FIELD IF SERVED
export const updateServed = async(salonId, _id) => {
    const updatedValue =   await JoinedQueueHistory.updateOne(
        { salonId, 'queueList._id': _id },
        { $set: { 'queueList.$.status': 'served' } }
      );
      return updatedValue;
}

 export const addQueueHistoryWhenCanceled = async(salonId, canceledQueue, updatedByBarberId) => {

  const newElement = {
    ...canceledQueue.toObject(), // Convert Mongoose document to plain JavaScript object
    updatedByBarberId,
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
