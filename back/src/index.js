const app = require("./app");
const port = process.env.PORT || 3001;

console.log(process.env.PORT);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
