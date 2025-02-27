import SalonQueueList from "../../../models/salonQueueListModel.js";
import { getBarberByBarberId } from "../barber/barberService.js";


// Find existing SalonQueueList
export const findSalonQueueList = async(salonId) => {
  const queueList = await SalonQueueList.findOne({ salonId: salonId });
  
  return queueList;
  }

//Adding new queue document
export const addNewQueue = async(salonId, newQueue) => {
  const newQueueData = new SalonQueueList({
      salonId: salonId,
      queueList: [newQueue],
    });
   await newQueueData.save();
   return newQueueData;
}

//Get salon queue list
export const getSalonQlist = async(salonId) => {

  const sortedQlist = await SalonQueueList.findOne({ salonId }).lean();

  if (!sortedQlist || !sortedQlist.queueList || sortedQlist.queueList.length === 0) {
    return [];
}

  const updatedQueueList = await Promise.all(
    sortedQlist.queueList.map(async (queue) => {
        const barber = await getBarberByBarberId(queue.barberId);
        return {
            ...queue, // Spread the existing queue properties
            barberEmail: barber ? barber.email : null, // Add barberEmail
            name: queue.customerName
        };
    })
);


return updatedQueueList;

}


//Find customers to send Mail for Q position change
export const findCustomersToMail = async(salonId, barberId) => {
  const customers = await SalonQueueList.find({ salonId, "queueList.barberId": barberId })

  return customers;
}



//GET Q LIST BY BARBER ID
export const qListByBarberId = async(salonId, barberId) => {
  const qList = await SalonQueueList.aggregate([
    {
      $match: {
        salonId: salonId
      }
    },
    {
      $unwind: "$queueList"
    },
    {
      $match: {
        "queueList.barberId": barberId
      }
    },
    {
      $group: {
        _id: "$queueList.barberId",
        queueList: { $push: "$queueList" }
      }
    },
    {
      $project: {
        _id: 0,
        queueList: 1
      }
    },
    //Changed for frontend 
    {
      $project: {
        queueList: {
          $map: {
            input: "$queueList",
            as: "list",
            in: {
              $mergeObjects: [
                "$$list",
                { "name": "$$list.customerName" } // Rename customerName to name
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        "queueList.customerName": 0 // Exclude the customerName field
      }
    }
  ]);

  return qList.map(item => item.queueList);

}