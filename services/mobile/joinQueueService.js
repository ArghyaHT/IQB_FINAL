import SalonQueueList from "../../models/salonQueueListModel.js";

//Get salon queue list
export const getSalonQlist = async (salonId, customerEmail) => {
  const defaultProfileImage = [
    {
      url: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1720520065/default-avatar-icon-of-social-media-user-vector_wl5pm0.jpg",
    },
  ];

  const Qlist = await SalonQueueList.aggregate([
    {
      $match: { salonId }, // Match salonId
    },
    {
      $unwind: "$queueList", // Unwind queueList array
    },
    {
      $sort: {
        "queueList.qPosition": 1, // Sort queue by qPosition
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "queueList.customerEmail",
        foreignField: "email",
        as: "customerData",
      },
    },
    {
      $addFields: {
        "queueList.name": "$queueList.customerName", // Always use customerName
        "queueList.customerProfile": {
          $cond: {
            if: { $gt: [{ $size: "$customerData" }, 0] }, // If customerData exists
            then: { $arrayElemAt: ["$customerData.profile", 0] }, // Extract profile
            else: defaultProfileImage, // Use default profile array
          },
        },
      },
    },
    {
      $project: {
        "queueList.customerName": 0,
        customerData: 0,
      },
    },
    {
      $group: {
        _id: "$_id", // Group by original document ID
        salonId: { $first: "$salonId" },
        queueList: { $push: "$queueList" }, // Convert back to an array
      },
    },
  ]);

  return Qlist;
};




// Find existing SalonQueueList
export const findSalonQueueList = async (salonId) => {
  const queueList = await SalonQueueList.findOne({ salonId: salonId });

  return queueList;
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

//Adding new queue document
export const addNewQueue = async (salonId, newQueue) => {
  const newQueueData = new SalonQueueList({
    salonId: salonId,
    queueList: [newQueue],
  });
  await newQueueData.save();
  return newQueueData;
}

//GET Q LIST BY BARBER ID
export const qListByBarberId = async (salonId, barberId) => {
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

  return qList;
}


