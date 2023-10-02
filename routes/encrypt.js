const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const { SecretsManagerClient, GetSecretValueCommand, ListSecretsCommand } = require("@aws-sdk/client-secrets-manager");

//Encrypting text
function encrypt(text) {
   text = String(text)
   let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return encrypted.toString('hex');
}

// Decrypting text
function decrypt(text) {
   text = String(text)
   console.log("text = ", text)
   //let iv_new = Buffer.from(iv.toString('hex'), 'hex');
   let encryptedText = Buffer.from(text, 'hex');
   let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   console.log("decrypted in fn = ", decrypted.toString())
   return decrypted.toString();
}

const client = new SecretsManagerClient({
   region: "ap-south-1",
 });

async function get_secret(name){
   //const command = new ListSecretsCommand();
   //const res = await client.send(command);
   //console.log("command = ", res)
   let response;

   try {
     response = await client.send(
       new GetSecretValueCommand({
         SecretId: name,
         VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
       })
     );
     const secret = JSON.parse(response.SecretString);

      console.log("secret = ", secret["key"])

      return secret
   } catch (error) {
     // For a list of exceptions thrown, see
     // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
     console.log("secret not found", error)
     return get_secret(name)
   }
}

get_secret("encrypt")


module.exports = {
   get_secret,
   decrypt,
   encrypt
};