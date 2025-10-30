const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase } = require('./utils/supabase');



// Import kiểu từ Express

type Request = import('express').Request;
type Response = import('express').Response;


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req :Request, res: Response) => {
  res.send('English backend is running!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});