const docuSign = require("docusign-esign");
const validator = require("validator");
const fs = require("fs");
const path = require("path");

//signerClientId is very important for the embedded signing flow

const signerClientId = 1000; //1000 for this application

//after completing the signing process in which page to return
const dsReturnUrl = "http://locahost:3002/ds-return"; //this will be return url of frontend
const demoDocsPath = path.resolve(__dirname, '../documents');
const pdf1File = 'World_Wide_Corp_lorem.pdf';
const pdf2File = 'demo.html';

const {
  ACCOUNT_ID,
  INTEGRATION_KEY,
  BASE_URL,
  USER_ID,
} = require("../config/docuSign");

function makeRecipientViewRequest(args) {
  const { dsReturnUrl, dsPingUrl, signerEmail, signerName, signerClientId } =
    args;

  let viewRequest = new docuSign.RecipientViewRequest();

  // Set the url where you want the recipient to go once they are done signing
  // should typically be a callback route somewhere in your app.
  // The query parameter is included as an example of how
  // to save/recover state information during the redirect to
  // the DocuSign signing. It's usually better to use
  // the session mechanism of your web framework. Query parameters
  // can be changed/spoofed very easily.
  viewRequest.returnUrl = dsReturnUrl + "?state=123"; //TODO state can be send as a argument

  // How has your app authenticated the user? In addition to your app's
  // authentication, you can include authenticate steps from DocuSign.
  // Eg, SMS authentication
  viewRequest.authenticationMethod = "none";

  // Recipient information must match embedded recipient info
  // we used to create the envelope.
  viewRequest.email = signerEmail;
  viewRequest.userName = signerName;
  viewRequest.clientUserId = signerClientId;

  // DocuSign recommends that you redirect to DocuSign for the
  // embedded signing. There are multiple ways to save state.
  // To maintain your application's session, use the pingUrl
  // parameter. It causes the DocuSign signing web page
  // (not the DocuSign server) to send pings via AJAX to your
  // app,
  //viewRequest.pingFrequency = 600; // seconds
  // NOTE: The pings will only be sent if the pingUrl is an https address
  // viewRequest.pingUrl = args.dsPingUrl; // optional setting

  return viewRequest;
}

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope:
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  const { signerEmail, signerName, signerClientId, docFile } = args;
  // document 1 (pdf) has tag /sn1/
  //
  // The envelope has one recipients.
  // recipient 1 - signer

  let docPdfBytes;
  // read file from a local directory
  // The read could raise an exception if the file is not available!
  docPdfBytes = fs.readFileSync(docFile);

  // create the envelope definition
  let env = new docuSign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document";

  //TODO need to check the multiple signature functionality

  // add the documents
  let doc1 = new docuSign.Document();
  let doc1b64 = Buffer.from(docPdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Lorem Ipsum"; // can be different from actual file name
  doc1.fileExtension = "html";
  doc1.documentId = "3";

  doc1.htmlDefinition={
    source : ''
  };

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];

  // Create a signer recipient to sign the document, identified by name and email
  // We set the clientUserId to enable embedded signing for the recipient
  // We're setting the parameters via the object creation
  let signer1 = docuSign.Signer.constructFromObject({
    email: signerEmail,
    name: signerName,
    clientUserId: signerClientId,
    recipientId: 1,
  });

  console.log("Singer1 Data >>>>>>>",signer1);

  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform seaches throughout your envelope's
  // documents for matching anchor strings.
  let signHere1 = docuSign.SignHere.constructFromObject({
    anchorString: "/sn1/",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });

  console.log("SignHere1 data >>>>",signHere1);

  // Tabs are set per recipient / signer
  let signer1Tabs = docuSign.Tabs.constructFromObject({
    signHereTabs: [signHere1],
  });
  signer1.tabs = signer1Tabs;

  // Add the recipient to the envelope object
  let recipients = docuSign.Recipients.constructFromObject({
    signers: [signer1],
  });

  console.log("Recipients data >>>>",recipients);
  
  env.recipients = recipients;

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = "sent";

  return env;
}

/**
 * This function does the work of creating the envelope and the
 * embedded signing
 * @param {object} args
 */
const sendEnvelopeForEmbeddedSigning = async (args) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId

  const { accessToken, basePath, accountId, envelopeArgs } = args;

  let dsApiClient = new docuSign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docuSign.EnvelopesApi(dsApiClient);

  // Step 1. Make the envelope request body
  // It will convert the file to the base64 formate as well set all the required parameter
  let envelope = makeEnvelope(envelopeArgs);

  console.log("Envelope >>>>>>>",envelope);

  // Step 2. call Envelopes::create API method
  // Exceptions will be caught by the calling function
  let results = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition: envelope,
  });

  console.log("Create Envelope Results : >>>>>", results);

  let envelopeId = results.envelopeId;
  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);

  // Step 3. create the recipient view, the embedded signing
  let viewRequest = makeRecipientViewRequest(envelopeArgs);

  console.log("View request >>>>", viewRequest);

  // Call the CreateRecipientView API
  // Exceptions will be caught by the calling function
  results = await envelopesApi.createRecipientView(accountId, envelopeId, {
    recipientViewRequest: viewRequest,
  });

  console.log("Create Recipient View result >>>>>", results);

  return { envelopeId: envelopeId, redirectUrl: results.url };
};

const createEnvelopEmbededSigning = async (req, res) => {
  console.log("Authorization >>>", req.header("Authorization"));
  console.log("Body details >>>>", req.body);
  const { signerEmail, signerName } = req.body;
  const bearerToken = req.header("Authorization");
  if (!bearerToken) {
    res.status(500).send("Send is not authorized!");
  }
  const accessToken = bearerToken?.split(" ")[1];
  console.log("Access token >>>", accessToken);

  const envelopeArgs = {
    signerEmail: validator.escape(signerEmail),
    signerName: validator.escape(signerName),
    signerClientId: signerClientId, // Id can be anything
    dsReturnUrl: dsReturnUrl,
    //dsPingUrl: dsPingUrl,  //optional
    docFile: path.resolve(demoDocsPath, pdf2File), //need to check pdf file or take the test pdf file
  };

  const args = {
    accessToken: accessToken, //need to get from header
    basePath: BASE_URL, //req.session.basePath  https://demo.docusign.net/restapi/v2.1
    accountId: ACCOUNT_ID, //req.session.accountId
    envelopeArgs: envelopeArgs,
  };

  try {
    let results = await sendEnvelopeForEmbeddedSigning(args);

    console.log("Results >>>>", results);

    //after that user will be redirected to the embeded sign in page
    res.send(results);
  } catch (error) {
    console.error("Error : >>>>>", error);
  }
};

module.exports = {
  createEnvelopEmbededSigning,
};
