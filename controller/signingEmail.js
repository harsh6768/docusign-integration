const docuSign = require("docusign-esign");
const validator = require("validator");
const fs = require("fs");
const path = require("path");

//signerClientId is very important for the embedded signing flow

const signerClientId = 1000; //1000 for this application

//after completing the signing process in which page to return
const dsReturnUrl = "http://locahost:3002/ds-return"; //this will be return url of frontend
const demoDocsPath = path.resolve(__dirname, "../documents");
// const pdf1File = "World_Wide_Corp_lorem.pdf";
// const pdf2File = "demo.html";

const doc2File = 'World_Wide_Corp_Battle_Plan_Trafalgar.docx';
const doc3File = 'World_Wide_Corp_lorem.pdf';

const {
  ACCOUNT_ID,
  INTEGRATION_KEY,
  BASE_URL,
  USER_ID,
} = require("../config/docuSign");

/**
 * This function does the work of creating the envelope
 */
const sendEnvelope = async (req, res) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId

  console.log("Authorization >>>", req.header("Authorization"));
  const { signer1Email, signer1Name, signer2Email, signer2Name,ccEmail, ccName ,status } = req.body;
  console.log("Body details >>>>", req.body);
//   res.send('Test');
  const bearerToken = req.header("Authorization");
  if (!bearerToken) {
    res.status(500).send("Send Envelope is not authorized!");
  }
  const accessToken = bearerToken?.split(" ")[1];
  console.log("Access token >>>", accessToken);

  let dsApiClient = new docuSign.ApiClient();
  dsApiClient.setBasePath(BASE_URL);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docuSign.EnvelopesApi(dsApiClient),
    results = null;

  const envelopeArgs = {
    signer1Email: validator.escape(signer1Email),
    signer1Name: validator.escape(signer1Name),
    signer2Email: validator.escape(signer2Email),
    signer2Name: validator.escape(signer2Name),
    // ccEmail: validator.escape(ccEmail),
    // ccName: validator.escape(ccName),
    status : status,
    signerClientId: signerClientId, // Id can be anything
    dsReturnUrl: dsReturnUrl,
    doc2File: path.resolve(demoDocsPath, doc2File),
    doc3File: path.resolve(demoDocsPath, doc3File)
    //dsPingUrl: dsPingUrl,  //optional
    // docFile: path.resolve(demoDocsPath, pdf2File), //need to check pdf file or take the test pdf file
  };
  console.log("envelop args >>>",envelopeArgs);
  // Step 1. Make the envelope request body
  let envelope = makeEnvelope(envelopeArgs);
  console.log("envelope definition >>>",envelope)

   // Step 2. call Envelopes::create API method
   // Exceptions will be caught by the calling function
  results = await envelopesApi.createEnvelope(ACCOUNT_ID, {
    envelopeDefinition: envelope,
  });

  console.log("create envelop result >>>",results);

  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  res.send({ envelopeId: envelopeId ,result: results});
// res.send(envelope)
};

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName
  // args.status
  // doc2File
  // doc3File
  const { signer1Email, signer1Name,signer2Email,signer2Name, ccEmail, ccName, status,doc2File,doc3File } = args;

  console.log("make envelope args >>>>>>",args);

  // document 1 (html) has tag **signature_1**
  // document 2 (docx) has tag /sn1/
  // document 3 (pdf) has tag /sn1/
  //
  // The envelope has two recipients.
  // recipient 1 - signer
  // recipient 2 - cc
  // The envelope will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.

    // let doc2DocxBytes, doc3PdfBytes;
  // read files from a local directory
  // The reads could raise an exception if the file is not available!
    // doc2DocxBytes = fs.readFileSync(doc2File);
    // doc3PdfBytes = fs.readFileSync(doc3File);

  // create the envelope definition
  let env = new docuSign.EnvelopeDefinition();
  env.emailSubject = "Please sign this HTML Test Document";

  // add the documents
  let doc1 = new docuSign.Document();
  let doc1b64 = Buffer.from(document1(args)).toString("base64");
//   let doc2b64 = Buffer.from(doc2DocxBytes).toString("base64");
//   let doc3b64 = Buffer.from(doc3PdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Order acknowledgement"; // can be different from actual file name
  doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
  doc1.documentId = "1"; // a label used to reference the doc

  console.log("Doc1 >>>>",doc1);
  // Alternate pattern: using constructors for docs 2 and 3...
    // let doc2 = new docuSign.Document.constructFromObject({
    //   documentBase64: doc2b64,
    //   name: "Battle Plan", // can be different from actual file name
    //   fileExtension: "docx",
    //   documentId: "2",
    // });

    // let doc3 = new docuSign.Document.constructFromObject({
    //   documentBase64: doc3b64,
    //   name: "Lorem Ipsum", // can be different from actual file name
    //   fileExtension: "pdf",
    //   documentId: "3",
    // });

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];

  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object constructor
  let signer1 = docuSign.Signer.constructFromObject({
    email: signer1Email,
    name: signer1Name,
    recipientId: "1",
    routingOrder: "1",
  });

  console.log("Signer 1 >>>>",signer1);

  let signer2 = docuSign.Signer.constructFromObject({
    email: signer2Email,
    name: signer2Name,
    recipientId: "2",
    routingOrder: "2",
  });

  console.log("Signer2 >>>>>",signer2);
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.

  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
//   let cc1 = new docuSign.CarbonCopy();
//   cc1.email = ccEmail;
//   cc1.name = ccName;
//   cc1.routingOrder = "3";
//   cc1.recipientId = "3";

  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform searches throughout your envelope's
  // documents for matching anchor strings. So the
  // signHere2 tab will be used in both document 2 and 3 since they
  // use the same anchor string for their "signer 1" tabs.
  let signHere1 = docuSign.SignHere.constructFromObject({
    anchorString: "**signature_1**",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
  console.log("signHere 1 >>>>",signHere1);
  let signHere2 = docuSign.SignHere.constructFromObject({
    anchorString: "**signature_2**",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
//   let signHere2 = docuSign.SignHere.constructFromObject({
//     anchorString: "/sn1/",
//     anchorYOffset: "10",
//     anchorUnits: "pixels",
//     anchorXOffset: "20",
//   });
  // Tabs are set per recipient / signer
  let signer1Tabs = docuSign.Tabs.constructFromObject({
    signHereTabs: [signHere1],
  });
  signer1.tabs = signer1Tabs;
  
  let signer2Tabs = docuSign.Tabs.constructFromObject({
      signHereTabs: [signHere2],
    });
  signer2.tabs = signer2Tabs;

  // Add the recipients to the envelope object
  let recipients = docuSign.Recipients.constructFromObject({
    signers: [signer1,signer2],
   });
   console.log("recipients >>>>",recipients);
// carbonCopies: [cc1],
  env.recipients = recipients;

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = status;

  return env;
}

/**
 * Creates document 1
 * @function
 * @private
 * @param {Object} args parameters for the envelope
 * @returns {string} A document in HTML format
 */

function document1(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName

  return `
      <!DOCTYPE html>
      <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family:sans-serif;margin-left:2em;">
          <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
              color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
          <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
            color: darkblue;">Order Processing Division</h2>
          <h4>Ordered by ${args.signerName}</h4>
          <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
          <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
          <p style="margin-top:3em;">
    Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
          </p>
          <!-- Note the anchor tag for the signature field is in white. -->
          <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
          <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_2**/</span></h3>
          </body>
      </html>
    `;
}

module.exports = { sendEnvelope };
