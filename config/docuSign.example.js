let AUTH_BASE_URL="account-d.docusign.com";
let BASE_URL="https://demo.docusign.net/restapi"; //https://demo.docusign.net/restapi/v2.1
let INTEGRATION_KEY="";
let ACCOUNT_ID="";
let USER_ID="";

//It is specific to project
let OAUTH_SECRET_KEY="";

let NODE_ENV=process.env.NODE_ENV||"local";

if(NODE_ENV=="production"){
    BASE_URL="";
    INTEGRATION_KEY="";
    ACCOUNT_ID="";
}


module.exports={
    AUTH_BASE_URL,
    BASE_URL,
    INTEGRATION_KEY,
    ACCOUNT_ID,
    USER_ID,
    OAUTH_SECRET_KEY
}


