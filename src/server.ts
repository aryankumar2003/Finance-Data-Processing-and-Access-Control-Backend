import app from './app'
import { env } from './config/env'

const PORT = process.env.PORT || env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`)
})