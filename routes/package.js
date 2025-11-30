import express from 'express';
import {
  createCarModRequest
} from '../controllers/carModController.js'; // updated controller import
import { auth } from '../middleware/auth.js';



const packageRouter = express.Router();

// All routes require authentication
packageRouter.use(auth);

// Create a new car modification request
packageRouter.post('/', createCarModRequest);





export default packageRouter;
