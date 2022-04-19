const express = require("express");
const app = express();

const routes = require("./routes/routes");

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
