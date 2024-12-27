import { getBarberByBarberId } from "../../../services/web/barber/barberService.js"
import { approveBarberDayOff, createBarberDayOff } from "../../../services/web/barberDayOff/barberDayOffService.js"
import { barberLeaveApproval } from "../../../utils/emailSender/emailSender.js"

export const barberDayOff = async(req, res, next) => {
    try{
        const {salonId, barberId, date, reason} = req.body
        if(!date){
            res.status(400).json({
                success: false,
                message: "Date not present"
            })
        }

        if(!reason){
            res.status(400).json({
                success: false,
                message: "Reason not present"
            })
        }

        const barberDayoffRequest = await createBarberDayOff(salonId, barberId, date, reason)

        if(barberDayoffRequest){
            res.status(200).json({
                success: false,
                message: "Your day off request has been sent for approval"
            })
        }
    }
    catch (error) {
        next(error);
    }
}

export const barberDayOffApprovalByAdmin = async(req, res, next) => {

    try{
        const {salonId, barberId, date} = req.body;

        if(!date){
            res.status(400).json({
                success: false,
                message: "Date not present"
            })
        }
      
        const barberDayoffApproved = await approveBarberDayOff(salonId, barberId, date)

        console.log(barberDayoffApproved)

        res.status(200).json({
            success: false,
            message: "Day off approved successfully"
        })

        const salon = await getSalonBySalonId(salonId);

        const barber = await getBarberByBarberId(barberId)

            // const formattedDate = moment(dateJoined, 'YYYY-MM-DD').format('DD-MM-YYYY');
    
            const emailSubject = `${salon.salonName}-Your leave has been approved`;
            const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Queue Position Changed</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                  .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                    .email-content {
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-content">
                    <div class="logo">
                    <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                </div>
                        <h1 style="text-align: center;">Queue Position Changed</h1>
                        <p>Dear ${barber.name},</p>
                        <p>Your leave has been approved. </p>
                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                            ${salon.salonName}<br>
                            Contact No.: +${salon.contactTel}<br>
                            EmailId: ${salon.salonEmail}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    
            try {
                await barberLeaveApproval(barber.email, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
            }

    }  
    catch (error) {
        next(error);
    }
}