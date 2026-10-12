import app from "./app/app.js";
import { connectToDB } from "./config/db.js";


await connectToDB()
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});