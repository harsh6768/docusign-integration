const Router = require("express").Router();
const Envelop = require("../controller/envelop");
const Template=require('../controller/template');
const signEmailController=require('../controller/signingEmail');
const Auth=require('../controller/auth');

Router.route("/getAuth").get((req, res) => {
  res.send("Tested!");
});


//oauth 
Router.route('/genOAuthToken').post(Auth.genAuthCode);
//create envelop
Router.route("/embededSigning").post(Envelop.createEnvelopEmbededSigning);
Router.route("/signingEmail").post(signEmailController.sendEnvelope);

//create template
Router.route("/testTemplate").post(Template.createTemplate);

module.exports = Router;
