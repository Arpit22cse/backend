const bcrypt=require('bcrypt');
const saltRounds = 10;


// Hash a password
async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// Validate a password
async function validatePassword(password, hashedPassword) {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

// Example Usage
// (async () => {
//   const password = "mysecretpassword";
//   const hashedPassword = await hashPassword(password);
//   console.log("Hashed Password:", hashedPassword);

//   const isMatch = await validatePassword(password, hashedPassword);
//   console.log("Password Match:", isMatch);
// })();

module.exports={hashPassword,validatePassword};