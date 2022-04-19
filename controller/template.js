const docuSign = require("docusign-esign");

const fs = require("fs");
const path = require("path");

const {
  ACCOUNT_ID,
  INTEGRATION_KEY,
  BASE_URL,
  USER_ID,
} = require("../config/docuSign");

const dsReturnUrl = "http://locahost:3002/ds-return"; //this will be return url of frontend
const demoDocsPath = path.resolve(__dirname, '../documents');
const pdf1File = 'World_Wide_Corp_lorem.pdf';

/**
 * Creates the template request object
 * @function
 * @returns {template} An template definition
 * @private
 */
function makeTemplate(args) {
  // Data for this method
  // demoDocsPath -- module global
  // docFile -- module global
  // templateName -- module global

  // document 1 (pdf) has tag /sn1/
  //
  // The template has two recipient roles.
  // recipient 1 - signer
  // recipient 2 - cc
  // The template will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.

  let docPdfBytes;
  // read file from a local directory
  // The reads could raise an exception if the file is not available!
  docPdfBytes = fs.readFileSync(args.docFile);

  // add the documents
  let doc = new docuSign.Document(),
    docB64 = Buffer.from(docPdfBytes).toString("base64");
  doc.documentBase64 = docB64;
  doc.name = "Lorem Ipsum"; // can be different from actual file name
  doc.fileExtension = "pdf";
  doc.documentId = "1";

  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object creation
  let signer1 = docuSign.Signer.constructFromObject({
    roleName: "signer",
    recipientId: "1",
    routingOrder: "1",
  });
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.

  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
  let cc1 = new docuSign.CarbonCopy();
  cc1.roleName = "cc";
  cc1.routingOrder = "2";
  cc1.recipientId = "2";

  // Create fields using absolute positioning:
  let signHere = docuSign.SignHere.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "191",
      yPosition: "148",
    }),
    // check1 = docuSign.Checkbox.constructFromObject({
    //   documentId: "1",
    //   pageNumber: "1",
    //   xPosition: "75",
    //   yPosition: "417",
    //   tabLabel: "ckAuthorization",
    // }),
    // check2 = docuSign.Checkbox.constructFromObject({
    //   documentId: "1",
    //   pageNumber: "1",
    //   xPosition: "75",
    //   yPosition: "447",
    //   tabLabel: "ckAuthentication",
    // }),
    // check3 = docuSign.Checkbox.constructFromObject({
    //   documentId: "1",
    //   pageNumber: "1",
    //   xPosition: "75",
    //   yPosition: "478",
    //   tabLabel: "ckAgreement",
    // }),
    // check4 = docuSign.Checkbox.constructFromObject({
    //   documentId: "1",
    //   pageNumber: "1",
    //   xPosition: "75",
    //   yPosition: "508",
    //   tabLabel: "ckAcknowledgement",
    // }),
    list1 = docuSign.List.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "142",
      yPosition: "291",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "list",
      required: "false",
      listItems: [
        docuSign.ListItem.constructFromObject({ text: "Red", value: "red" }),
        docuSign.ListItem.constructFromObject({
          text: "Orange",
          value: "orange",
        }),
        docuSign.ListItem.constructFromObject({
          text: "Yellow",
          value: "yellow",
        }),
        docuSign.ListItem.constructFromObject({
          text: "Green",
          value: "green",
        }),
        docuSign.ListItem.constructFromObject({ text: "Blue", value: "blue" }),
        docuSign.ListItem.constructFromObject({
          text: "Indigo",
          value: "indigo",
        }),
        docuSign.ListItem.constructFromObject({
          text: "Violet",
          value: "violet",
        }),
      ],
    }),
    // The SDK can't create a number tab at this time. Bug DCM-2732
    // Until it is fixed, use a text tab instead.
    //   , number = docusign.Number.constructFromObject({
    //         documentId: "1", pageNumber: "1", xPosition: "163", yPosition: "260",
    //         font: "helvetica", fontSize: "size14", tabLabel: "numbersOnly",
    //         height: "23", width: "84", required: "false"})
    textInsteadOfNumber = docuSign.Text.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "153",
      yPosition: "260",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "numbersOnly",
      height: "23",
      width: "84",
      required: "false",
    }),
    // radioGroup = docusign.RadioGroup.constructFromObject({
    //   documentId: "1",
    //   groupName: "radio1",
    //   radios: [
    //     docusign.Radio.constructFromObject({
    //       font: "helvetica",
    //       fontSize: "size14",
    //       pageNumber: "1",
    //       value: "white",
    //       xPosition: "142",
    //       yPosition: "384",
    //       required: "false",
    //     }),
    //     docusign.Radio.constructFromObject({
    //       font: "helvetica",
    //       fontSize: "size14",
    //       pageNumber: "1",
    //       value: "red",
    //       xPosition: "74",
    //       yPosition: "384",
    //       required: "false",
    //     }),
    //     docusign.Radio.constructFromObject({
    //       font: "helvetica",
    //       fontSize: "size14",
    //       pageNumber: "1",
    //       value: "blue",
    //       xPosition: "220",
    //       yPosition: "384",
    //       required: "false",
    //     }),
    //   ],
    // }),
    text = docuSign.Text.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "153",
      yPosition: "230",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "text",
      height: "23",
      width: "84",
      required: "false",
    });
  // Tabs are set per recipient / signer
  let signer1Tabs = docuSign.Tabs.constructFromObject({
    // checkboxTabs: [check1, check2, check3, check4],
    listTabs: [list1],
    // numberTabs: [number],
    // radioGroupTabs: [radioGroup],
    signHereTabs: [signHere],
    textTabs: [text, textInsteadOfNumber],
  });
  signer1.tabs = signer1Tabs;

  // Add the recipients to the env object
  let recipients = docuSign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });

  // create the overall template definition
  let template = new docuSign.EnvelopeTemplate.constructFromObject({
    // The order in the docs array determines the order in the env
    documents: [doc],
    emailSubject: "Please sign this document",
    description: "Example template created via the API",
    name: args.templateName,
    shared: "false",
    recipients: recipients,
    status: "created",
  });

  return template;
}

const createTemplate =async (req, res) => {

  const  {templateName} = req.body;
  const bearerToken = req.header("Authorization");
  if (!bearerToken) {
    res.status(500).send("Send is not authorized!");
  }
  const accessToken = bearerToken?.split(" ")[1];
  console.log("Access token >>>", accessToken);

  const htmlTemplate = path.resolve(__dirname, "../documents/demo.html");
  console.log("htmlTemplate", htmlTemplate);
  const data = fs.readFileSync(htmlTemplate, "utf8");
  
//   console.log("File Data >>>>", data);

  let dsApiClient = new docuSign.ApiClient();
  dsApiClient.setBasePath(BASE_URL);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let templatesApi = new docuSign.TemplatesApi(dsApiClient);

  // args.basePath
  // args.accessToken
  // args.accountId
  // args.templateName

  const args={
      basePath : BASE_URL,
      accountId:ACCOUNT_ID,
      accessToken : accessToken,
      templateName : templateName,
      docFile :  path.resolve(demoDocsPath, pdf1File)
  }

  let templateReqObject = makeTemplate(args);

  console.log("Template Object >>>>",templateReqObject)

   let  results = await templatesApi.createTemplate(args.accountId, {
        envelopeTemplate: templateReqObject,
    });

    console.log("create template REsult >>>>>",results);

    //Get created template details 
    // {{baseUrl}}/{{apiVersion}}/accounts/{{accountId}}/templates/41d0a309-2256-4536-a77c-4ed77f414e86
  res.send(results);
};

module.exports = {
  createTemplate,
};
