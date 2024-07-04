const jwt = require('jsonwebtoken');


const SECRET_KEY = 'e13286b763139c28bd5eb87695dbbc9f408c554919cb20717a8d8a0ccb5da6dc';

// TOKEN TEST PART
const userPayload = {
    user_id: 101,
    name: "Aman Yadav",
    email: "aman.test@estiam.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    role: "student"
};

const token = jwt.sign(userPayload, SECRET_KEY);
console.log(token);