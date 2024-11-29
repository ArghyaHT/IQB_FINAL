import SalonQueueList from "../../../models/salonQueueListModel.js"

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

//Adding members in group join
export const addGroupJoin = async(salonId) => {
    const existingQueue = new SalonQueueList({
        salonId: salonId,
        queueList: [],
      });
      await existingQueue.save();
      return existingQueue;
}

//Get salon queue list
export const getSalonQlist = async(salonId) => {
    const sortedQlist = await SalonQueueList.aggregate([
        {
          $match: { salonId } // Match the document based on salonId
        },
        {
          $unwind: "$queueList" // Deconstruct queueList array
        },
        {
          $sort: {
            "queueList.qPosition": 1 // Sort by qPosition in ascending order (1)
          }
        },
        {
          $group: {
            _id: "$_id", // Group by the document's _id field
            queueList: { $push: "$queueList" } // Reconstruct the queueList array
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

      if(sortedQlist.length > 0){
        return sortedQlist
      }else{
        return [
          {
            queueList:[]
          }
        ]
      }

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