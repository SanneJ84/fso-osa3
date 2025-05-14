require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()
const path = require('path')

app.use(express.static('dist'))                                // Käytetään staattista tiedostopalvelinta, jotta voimme palvella HTML-tiedostoja
app.use(express.json())                                        // Käytetään JSON-muotoista dataa jotta voidaan käsitellä JSON-pyyntöjä
app.use(cors())                                                // Käytetään CORSia, jotta voidaan tehdä pyyntöjä eri domaineista


// Määritellään morganin loggaustyyli, joka näyttää myös requestin bodyn
morgan.token('body', (req) => JSON.stringify(req.body))

// Käytetään morgan middlewarea, joka loggaa kaikki saapuvat HTTP-pyynnöt
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// Reitit

// Kaikkien henkilöiden hakeminen
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

// Yksittäisen henkilön hakeminen ID:n perusteella
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

// Henkilön poistaminen
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})


// Uuden henkilön lisääminen
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'Name or number is missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => next(error))
})

app.get('/api/info', (request, response) => {
  const date = new Date()
  Person.countDocuments({})
    .then(count => {
      response.send(`<p>Phonebook has info for ${count} people</p><p>${date}</p>`)
    })
    .catch(error => {
      console.log(error)
      response.status(500).send({ 'error counting documents': error.message })
    })
})

// Alkunäkymä
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Tuntemattomat reitit
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// Estetään virheilmoitus joka syntyy, kun selain yrittää ladata faviconia
app.get('/favicon.ico', (req, res) => res.status(204).end())


app.use(unknownEndpoint)

// Virheiden käsittely
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

// tämä tulee kaikkien muiden middlewarejen ja routejen rekisteröinnin jälkeen!
app.use(errorHandler)

// Palvelimen käynnistys
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
