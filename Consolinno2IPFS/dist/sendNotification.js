import nodemailer from "nodemailer";
const sendNotification = async (balance, newAddress) => {
    var transporter = nodemailer.createTransport({
        host: "11335-13.root.nessus.at",
        port: 587,
        secure: false,
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
    async function wrapedSendMail(mailOptions) {
        return new Promise((resolve, reject) => {
            let resp = false;
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    resolve(false);
                }
                else {
                    console.log('Email sent: ' + info.response);
                    resolve(true);
                }
            });
        });
    }
    return resp;
};
export default sendNotification;
