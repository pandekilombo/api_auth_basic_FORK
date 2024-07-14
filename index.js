import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import UserController from './controllers/UserController.js';
import AuthController from './controllers/AuthController.js';
/*import Test from './controllers/Test.js'
*/


const app = express();

app.use(
    cors({
        origin: 'http://localhost:3000',
        // Allow follow-up middleware to override this CORS for options
        preflightContinue: true,
    }),
);



app.use(bodyParser.json());
app.use('/api/v1/users', UserController);
app.use('/api/v1/auth', AuthController);
/*app.use('/api/v1/test', Test)
*/
app.listen(3001, ()  => {
    console.log('Server is running on port 3001');
});
