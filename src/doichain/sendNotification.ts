// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'node... Remove this comment to see the full error message
import nodemailer from "nodemailer"


const sendNotification = async (balance: any, newAddress: any) => {

    var transporter = nodemailer.createTransport({
        host: "11335-13.root.nessus.at",
        port: 587,
        secure: false, // upgrade later with STARTTL
        auth: {
          user: "nms",
          pass: ""
        }
      });

    var mailOptions = {
        from: "RaspberryPi",
        to: "",
        subject: "Dois sind bald leer",
        text: 'Hallo, das Wallet hat nur noch ' + balance + ' Dois. Bitte schicke mehr an die Raspberry Addresse: ' + newAddress + ' . Vielen Dank'
    };

    let resp = await wrapedSendMail(mailOptions);

    async function wrapedSendMail(mailOptions: any) {

        return new Promise((resolve, reject) => {
            let resp = false;

            transporter.sendMail(mailOptions, function (error: any, info: any) {
                if (error) {
                    console.log(error);
                    resolve(false)
                } else {
                    console.log('Email sent: ' + info.response);
                    resolve(true)
                }
            });
        });
    }
    return resp;
}


export default sendNotification
