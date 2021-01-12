const app = require('./src')
const { app: { port } } = require('./src/configs')
app.listen(port, () => {
  console.log('===============================================')
  console.log('Server E Learning is runing on PORT: ', port)
  console.log('===============================================')
})
