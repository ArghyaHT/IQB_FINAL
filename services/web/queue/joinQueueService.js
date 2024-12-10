import SalonQueueList from "../../../models/salonQueueListModel.js"
import { getBarberByBarberId } from "../barber/barberService.js";

// Find existing SalonQueueList
export const findSalonQueueList = async (salonId) => {
  const queueList = await SalonQueueList.findOne({ salonId: salonId });

  return queueList;
}

//Adding new queue document
export const addNewQueue = async (salonId, newQueue) => {
  const newQueueData = new SalonQueueList({
    salonId: salonId,
    queueList: [newQueue],
  });
  await newQueueData.save();
  return newQueueData;
}

//Adding members in group join
export const addGroupJoin = async (salonId) => {
  const existingQueue = new SalonQueueList({
    salonId: salonId,
    queueList: [],
  });
  await existingQueue.save();
  return existingQueue;
}

//Get salon queue list
// export const getSalonQlist = async (salonId) => {

//   const sortedQlist = await SalonQueueList.findOne({ salonId });


//   // const sortedQlist = await SalonQueueList.aggregate([
//   //     {
//   //       $match: { salonId } // Match the document based on salonId
//   //     },
//   //     {
//   //       $unwind: "$queueList" // Deconstruct queueList array
//   //     },
//   //     {
//   //       $sort: {
//   //         "queueList.qPosition": 1 // Sort by qPosition in ascending order (1)
//   //       }
//   //     },
//   //     {
//   //       $group: {
//   //         _id: "$_id", // Group by the document's _id field
//   //         queueList: { $push: "$queueList" } // Reconstruct the queueList array
//   //       }
//   //     },
//   //     //Changed for frontend 
//   //     {
//   //       $project: {
//   //         queueList: {
//   //           $map: {
//   //             input: "$queueList",
//   //             as: "list",
//   //             in: {
//   //               $mergeObjects: [
//   //                 "$$list",
//   //                 { "name": "$$list.customerName" } // Rename customerName to name
//   //               ]
//   //             }
//   //           }
//   //         }
//   //       }
//   //     },
//   //     {
//   //       $project: {
//   //         "queueList.customerName": 0 // Exclude the customerName field
//   //       }
//   //     }
//   //   ]);

//   // if(sortedQlist.length > 0){
//   //   return sortedQlist
//   // }else{
//   //   return [
//   //     {
//   //       queueList:[]
//   //     }
//   //   ]
//   // }

//   //  if(sortedQlist.queueList.length > 0){
//   //   return sortedQlist.queueList
//   // }else{
//   //   return [
//   //     {
//   //       queueList:[]
//   //     }
//   //   ]
//   // }

//   // console.log(sortedQlist)

//   if (!sortedQlist || !sortedQlist.queueList || sortedQlist.queueList.length === 0) {
//     return [];
//   }


//   return sortedQlist.queueList

// }

export const getSalonQlist = async (salonId) => {
  const sortedQlist = await SalonQueueList.findOne({ salonId }).lean();

  if (!sortedQlist || !sortedQlist.queueList || sortedQlist.queueList.length === 0) {
    return [];
  }

  const modifyQueuelist = await Promise.all(
    sortedQlist.queueList.map(async (queue) => {
        const barber = await getBarberByBarberId(queue.barberId);
        return {
            ...queue, // Spread the existing queue properties
            barberEmail: barber ? barber.email : null, // Add barberEmail
            name: queue.customerName
        };
      })
    )
  return modifyQueuelist;  // Return the modified list, not the original one
}


//Find customers to send Mail for Q position change
export const findCustomersToMail = async (salonId, barberId) => {
  const customers = await SalonQueueList.find({ salonId, "queueList.barberId": barberId })

  return customers;
}


//GET Q LIST BY BARBER ID
export const qListByBarberId = async (salonId, barberId) => {

  const qlist = await SalonQueueList.findOne({ salonId }).lean()

  const modifyQueuelist = qlist.queueList.map((queue) => ({
    ...queue, 
    name: queue.customerName 
  }));

  if (modifyQueuelist) {
    const filteredQueueList = modifyQueuelist.filter(item => item.barberId === barberId);

    return filteredQueueList
  }

  // const qList = await SalonQueueList.aggregate([
  //   {
  //     $match: {
  //       salonId: salonId
  //     }
  //   },
  //   {
  //     $unwind: "$queueList"
  //   },
  //   {
  //     $match: {
  //       "queueList.barberId": barberId
  //     }
  //   },
  //   {
  //     $group: {
  //       _id: "$queueList.barberId",
  //       queueList: { $push: "$queueList" }
  //     }
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       queueList: 1
  //     }
  //   },
  //   //Changed for frontend 
  //   {
  //     $project: {
  //       queueList: {
  //         $map: {
  //           input: "$queueList",
  //           as: "list",
  //           in: {
  //             $mergeObjects: [
  //               "$$list",
  //               { "name": "$$list.customerName" } // Rename customerName to name
  //             ]
  //           }
  //         }
  //       }
  //     }
  //   },
  //   {
  //     $project: {
  //       "queueList.customerName": 0 // Exclude the customerName field
  //     }
  //   }
  // ]);

  // return qList.map(item => item.queueList);
}