const docuSign = require("docusign-esign");
const require=require('axios');

// const open=require('open');

// NOTE: change this to account.docusign.com for production
const oAuthBasePath = "account-d.docusign.com";
// 'signature' for eSignature, organization_read to retreive your OrgId
const scopes = "signature+organization_read+click.manage+user_write";



const {
  ACCOUNT_ID,
  INTEGRATION_KEY,
  BASE_URL,
  USER_ID,
  OAUTH_SECRET_KEY,
} = require("../config/docuSign");

const genAuthCode = async (req, res) => {
  // await open(`https://${oAuthBasePath}/oauth/auth?response_type=code&scope=${scopes}&client_id=${integrationKey}&redirect_uri=http://localhost:5000`, {wait: true});

  let { authorizationCode } = req.body;

  try {
    let apiClient = new docuSign.ApiClient();
    apiClient.setOAuthBasePath(oAuthBasePath);
    let response = await apiClient.generateAccessToken(
      INTEGRATION_KEY,
      OAUTH_SECRET_KEY,
      authorizationCode
    );
    // Show the API response
    console.log("Oauth response>>>>>", response);

    // Save the expiration time, accessToken, and refreshToken variables
    const expiry = response.expiresIn;

    // A token is a token is a token!  This Access token will work just the same will other API calls below
    const accessToken = response.accessToken;

    // Access tokens provided by Authorization Code Grant will last for 8 hours.
    // Use this refresh token to allow them to generate a new one without needing
    // to login again. The refresh token is valid for 30 days.
    const refreshToken = response.refreshToken;

    // Accessible JSON from module exports
    res.send({
      expiry: expiry,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.error(err);
    // exit(1);
  }
};

const genTokenFromRefreshToken = async (req, res) => {
  // let apiClient = new docuSign.ApiClient();
  // apiClient.setOAuthBasePath(oAuthBasePath);
  // let auth=new  docuSign.AuthenticationApi(apiClient);
  const { refreshToken } = req.body;
  try {
  } catch (error) {}
};
module.exports = {
  genAuthCode,
  genTokenFromRefreshToken,
};
